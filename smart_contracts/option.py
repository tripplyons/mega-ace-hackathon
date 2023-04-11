import beaker
import pyteal as pt

from smart_contracts.helpers.deployment_standard import (
    deploy_time_immutability_control,
    deploy_time_permanence_control,
)


class OptionState:
    creator = beaker.state.GlobalStateValue(
        stack_type=pt.TealType.bytes, descr="Address of creator"
    )

    buyer = beaker.state.GlobalStateValue(
        stack_type=pt.TealType.bytes, descr="Address of buyer"
    )

    expiry = beaker.state.GlobalStateValue(
        stack_type=pt.TealType.uint64, descr="Unix time of option expiry"
    )

    strike = beaker.state.GlobalStateValue(
        stack_type=pt.TealType.uint64, descr="Strike price of option"
    )

    premium = beaker.state.GlobalStateValue(
        stack_type=pt.TealType.uint64, descr="Premium paid for option"
    )

    asa = beaker.state.GlobalStateValue(
        stack_type=pt.TealType.uint64, descr="Underlying ASA"
    )

    ready = beaker.state.GlobalStateValue(
        stack_type=pt.TealType.uint64, descr="If the ASA has been transferred"
    )

    completed = beaker.state.GlobalStateValue(
        stack_type=pt.TealType.uint64,
        descr="Whether option has been exercised or expired",
    )


app = (
    beaker.Application("Option", state=OptionState)
    .apply(deploy_time_immutability_control)
    .apply(deploy_time_permanence_control)
)


@app.create
def create(
    time: pt.abi.Uint64,
    strike: pt.abi.Uint64,
    premium: pt.abi.Uint64,
    *,
    output: pt.abi.Uint64
) -> pt.Expr:
    return pt.Seq(
        pt.Assert(pt.Txn.assets.length() == pt.Int(1)),
        app.state.creator.set(pt.Txn.sender()),
        app.state.buyer.set(pt.Txn.sender()),
        app.state.expiry.set(pt.Global.latest_timestamp() + time.get()),
        app.state.strike.set(strike.get()),
        app.state.premium.set(premium.get()),
        app.state.completed.set(pt.Int(0)),
        app.state.ready.set(pt.Int(0)),
        app.state.asa.set(pt.Txn.assets[0]),
        output.set(pt.Int(1)),
    )


@app.external(read_only=True)
def get_expiry(*, output: pt.abi.Uint64) -> pt.Expr:
    return output.set(app.state.expiry.get())


@app.external(read_only=True)
def get_strike(*, output: pt.abi.Uint64) -> pt.Expr:
    return output.set(app.state.strike.get())


@app.external(read_only=True)
def get_premium(*, output: pt.abi.Uint64) -> pt.Expr:
    return output.set(app.state.premium.get())


@app.external(read_only=True)
def get_asa(*, output: pt.abi.Uint64) -> pt.Expr:
    return output.set(app.state.asa.get())


@app.external(read_only=True)
def get_completed(*, output: pt.abi.Uint64) -> pt.Expr:
    return output.set(app.state.completed.get())


@app.external(read_only=True)
def get_creator(*, output: pt.abi.Address) -> pt.Expr:
    return output.set(app.state.creator.get())


@app.external(read_only=True)
def get_buyer(*, output: pt.abi.Address) -> pt.Expr:
    return output.set(app.state.buyer.get())


@app.external()
def opt_in_to_asa(*, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        pt.Assert(pt.Txn.sender() == app.state.creator.get()),
        pt.Assert(app.state.ready.get() == pt.Int(0)),
        pt.Assert(app.state.asa.get() == pt.Txn.assets[0]),
        # opt contract in to ASA
        pt.InnerTxnBuilder.Begin(),
        pt.InnerTxnBuilder.SetField(pt.TxnField.type_enum, pt.TxnType.AssetTransfer),
        pt.InnerTxnBuilder.SetField(pt.TxnField.xfer_asset, pt.Txn.assets[0]),
        pt.InnerTxnBuilder.SetField(pt.TxnField.asset_amount, pt.Int(0)),
        pt.InnerTxnBuilder.SetField(
            pt.TxnField.asset_receiver, pt.Global.current_application_address()
        ),
        pt.InnerTxnBuilder.SetField(
            pt.TxnField.sender, pt.Global.current_application_address()
        ),
        pt.InnerTxnBuilder.SetField(pt.TxnField.fee, pt.Int(0)),
        pt.InnerTxnBuilder.Submit(),
    )


@app.external
def transfer_asa(*, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        pt.Assert(pt.Txn.sender() == app.state.creator.get()),
        pt.Assert(pt.Txn.assets.length() == pt.Int(1)),
        pt.Assert(app.state.ready.get() == pt.Int(0)),
        # make sure the ASA is transferred from the creator
        pt.Assert(pt.Global.group_size() == pt.Int(2)),
        pt.Assert(pt.Gtxn[1].type_enum() == pt.TxnType.AssetTransfer),
        pt.Assert(
            pt.Gtxn[1].asset_receiver() == pt.Global.current_application_address()
        ),
        pt.Assert(pt.Gtxn[1].asset_amount() == pt.Int(1)),
        pt.Assert(pt.Gtxn[1].xfer_asset() == app.state.asa.get()),
        app.state.ready.set(pt.Int(1)),
        output.set(pt.Int(1)),
    )


@app.external
def cancel(*, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        pt.Assert(pt.Txn.sender() == app.state.creator.get()),
        pt.Assert(app.state.creator.get() == app.state.buyer.get()),
        pt.Assert(app.state.completed.get() == pt.Int(0)),
        pt.Assert(app.state.ready.get() == pt.Int(1)),
        pt.Assert(app.state.asa.get() == pt.Txn.assets[0]),
        app.state.completed.set(pt.Int(1)),
        # send ASA back to creator
        pt.InnerTxnBuilder.Begin(),
        pt.InnerTxnBuilder.SetField(pt.TxnField.type_enum, pt.TxnType.AssetTransfer),
        pt.InnerTxnBuilder.SetField(pt.TxnField.xfer_asset, pt.Txn.assets[0]),
        pt.InnerTxnBuilder.SetField(pt.TxnField.asset_amount, pt.Int(1)),
        pt.InnerTxnBuilder.SetField(
            pt.TxnField.asset_receiver, app.state.creator.get()
        ),
        pt.InnerTxnBuilder.SetField(
            pt.TxnField.sender, pt.Global.current_application_address()
        ),
        pt.InnerTxnBuilder.SetField(pt.TxnField.fee, pt.Int(0)),
        pt.InnerTxnBuilder.Submit(),
        output.set(pt.Int(1)),
    )


@app.external
def buy(payment: pt.abi.PaymentTransaction, *, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        pt.Assert(payment.get().amount() == app.state.premium.get()),
        pt.Assert(payment.get().receiver() == app.state.creator.get()),
        pt.Assert(app.state.buyer.get() == app.state.creator.get()),
        pt.Assert(pt.Txn.sender() != app.state.creator.get()),
        pt.Assert(pt.Global.latest_timestamp() < app.state.expiry.get()),
        pt.Assert(app.state.completed.get() == pt.Int(0)),
        pt.Assert(app.state.ready.get() == pt.Int(1)),
        app.state.buyer.set(pt.Txn.sender()),
        output.set(pt.Int(1)),
    )


@app.external
def exercise(payment: pt.abi.PaymentTransaction, *, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        pt.Assert(payment.get().amount() == app.state.strike.get()),
        pt.Assert(payment.get().receiver() == app.state.buyer.get()),
        pt.Assert(app.state.buyer.get() == pt.Txn.sender()),
        pt.Assert(pt.Global.latest_timestamp() < app.state.expiry.get()),
        pt.Assert(app.state.completed.get() == pt.Int(0)),
        pt.Assert(app.state.ready.get() == pt.Int(1)),
        app.state.completed.set(pt.Int(1)),
        # send ASA to buyer
        pt.InnerTxnBuilder.Begin(),
        pt.InnerTxnBuilder.SetField(pt.TxnField.type_enum, pt.TxnType.AssetTransfer),
        pt.InnerTxnBuilder.SetField(pt.TxnField.xfer_asset, app.state.asa.get()),
        pt.InnerTxnBuilder.SetField(pt.TxnField.asset_amount, pt.Int(1)),
        pt.InnerTxnBuilder.SetField(pt.TxnField.asset_receiver, app.state.buyer.get()),
        pt.InnerTxnBuilder.SetField(
            pt.TxnField.asset_sender, pt.Global.current_application_address()
        ),
        pt.InnerTxnBuilder.SetField(pt.TxnField.fee, pt.Int(0)),
        pt.InnerTxnBuilder.Submit(),
        output.set(pt.Int(1)),
    )


@app.external
def expire(*, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        pt.Assert(pt.Global.latest_timestamp() >= app.state.expiry.get()),
        pt.Assert(app.state.completed.get() == pt.Int(0)),
        pt.Assert(app.state.creator.get() == pt.Txn.sender()),
        pt.Assert(app.state.ready.get() == pt.Int(1)),
        app.state.completed.set(pt.Int(1)),
        # send ASA back to creator
        pt.InnerTxnBuilder.Begin(),
        pt.InnerTxnBuilder.SetField(pt.TxnField.type_enum, pt.TxnType.AssetTransfer),
        pt.InnerTxnBuilder.SetField(pt.TxnField.xfer_asset, app.state.asa.get()),
        pt.InnerTxnBuilder.SetField(pt.TxnField.asset_amount, pt.Int(1)),
        pt.InnerTxnBuilder.SetField(
            pt.TxnField.asset_receiver, app.state.creator.get()
        ),
        pt.InnerTxnBuilder.SetField(
            pt.TxnField.asset_sender, pt.Global.current_application_address()
        ),
        pt.InnerTxnBuilder.SetField(pt.TxnField.fee, pt.Int(0)),
        pt.InnerTxnBuilder.Submit(),
        output.set(pt.Int(1)),
    )
