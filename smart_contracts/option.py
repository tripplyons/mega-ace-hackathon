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
def create(*, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        # initial state
        app.state.creator.set(pt.Txn.sender()),
        app.state.buyer.set(pt.Itob(pt.Int(0))),
        app.state.expiry.set(pt.Int(0)),
        app.state.strike.set(pt.Int(0)),
        app.state.premium.set(pt.Int(0)),
        app.state.completed.set(pt.Int(0)),
        app.state.ready.set(pt.Int(0)),
        app.state.asa.set(pt.Int(0)),
        output.set(pt.Int(1)),
    )


@app.external()
def set_params(
    time: pt.abi.Uint64,
    strike: pt.abi.Uint64,
    premium: pt.abi.Uint64,
    *,
    output: pt.abi.Uint64
) -> pt.Expr:
    return pt.Seq(
        # from the creator
        pt.Assert(pt.Txn.sender() == app.state.creator.get()),
        # has ASA
        pt.Assert(pt.Txn.assets.length() == pt.Int(1)),
        # not ready yet
        pt.Assert(app.state.ready.get() == pt.Int(0)),
        # no params set yet
        pt.Assert(app.state.expiry.get() == pt.Int(0)),
        # set params
        app.state.expiry.set(pt.Global.latest_timestamp() + time.get()),
        app.state.strike.set(strike.get()),
        app.state.premium.set(premium.get()),
        app.state.asa.set(pt.Txn.assets[0]),
        output.set(pt.Int(1)),
    )


@app.external()
def opt_in_to_asa(*, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        # from the creator
        pt.Assert(pt.Txn.sender() == app.state.creator.get()),
        # has params set
        pt.Assert(app.state.expiry.get() != pt.Int(0)),
        # not ready yet
        pt.Assert(app.state.ready.get() == pt.Int(0)),
        # correct ASA
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
        # from the creator
        pt.Assert(pt.Txn.sender() == app.state.creator.get()),
        # has params set
        pt.Assert(app.state.expiry.get() != pt.Int(0)),
        # correct ASA
        pt.Assert(pt.Txn.assets.length() == pt.Int(1)),
        pt.Assert(pt.Txn.assets[0] == app.state.asa.get()),
        # not ready yet
        pt.Assert(app.state.ready.get() == pt.Int(0)),
        # make sure the ASA is transferred from the creator
        pt.Assert(pt.Global.group_size() == pt.Int(2)),
        pt.Assert(pt.Gtxn[0].type_enum() == pt.TxnType.AssetTransfer),
        pt.Assert(
            pt.Gtxn[0].asset_receiver() == pt.Global.current_application_address()
        ),
        pt.Assert(pt.Gtxn[0].asset_amount() == pt.Int(1)),
        pt.Assert(pt.Gtxn[0].xfer_asset() == app.state.asa.get()),
        app.state.ready.set(pt.Int(1)),
        output.set(pt.Int(1)),
    )


@app.external
def cancel(*, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        # from the creator
        pt.Assert(pt.Txn.sender() == app.state.creator.get()),
        # no buyer yet
        pt.Assert(app.state.buyer.get() == pt.Itob(pt.Int(0))),
        # not completed
        pt.Assert(app.state.completed.get() == pt.Int(0)),
        # ready
        pt.Assert(app.state.ready.get() == pt.Int(1)),
        # correct ASA
        pt.Assert(app.state.asa.get() == pt.Txn.assets[0]),
        # complete
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
def buy(*, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        # paid for the premium
        pt.Assert(pt.Global.group_size() == pt.Int(2)),
        pt.Assert(pt.Gtxn[0].type_enum() == pt.TxnType.Payment),
        pt.Assert(pt.Gtxn[0].amount() == app.state.premium.get()),
        pt.Assert(pt.Gtxn[0].receiver() == app.state.buyer.get()),
        # no buyer yet
        pt.Assert(app.state.buyer.get() == pt.Itob(pt.Int(0))),
        pt.Assert(pt.Txn.sender() != app.state.creator.get()),
        # not expired
        pt.Assert(pt.Global.latest_timestamp() < app.state.expiry.get()),
        # not completed
        pt.Assert(app.state.completed.get() == pt.Int(0)),
        # ready
        pt.Assert(app.state.ready.get() == pt.Int(1)),
        # set buyer
        app.state.buyer.set(pt.Txn.sender()),
        output.set(pt.Int(1)),
    )


@app.external
def exercise(*, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        # paid for the strike
        pt.Assert(pt.Global.group_size() == pt.Int(2)),
        pt.Assert(pt.Gtxn[0].type_enum() == pt.TxnType.Payment),
        pt.Assert(pt.Gtxn[0].amount() == app.state.strike.get()),
        pt.Assert(pt.Gtxn[0].receiver() == app.state.creator.get()),
        # correct buyer
        pt.Assert(app.state.buyer.get() == pt.Txn.sender()),
        # not expired
        pt.Assert(pt.Global.latest_timestamp() < app.state.expiry.get()),
        # not completed
        pt.Assert(app.state.completed.get() == pt.Int(0)),
        # ready
        pt.Assert(app.state.ready.get() == pt.Int(1)),
        # complete
        app.state.completed.set(pt.Int(1)),
        # send ASA to buyer
        pt.InnerTxnBuilder.Begin(),
        pt.InnerTxnBuilder.SetField(pt.TxnField.type_enum, pt.TxnType.AssetTransfer),
        pt.InnerTxnBuilder.SetField(pt.TxnField.xfer_asset, app.state.asa.get()),
        pt.InnerTxnBuilder.SetField(pt.TxnField.asset_amount, pt.Int(1)),
        pt.InnerTxnBuilder.SetField(pt.TxnField.asset_receiver, app.state.buyer.get()),
        pt.InnerTxnBuilder.SetField(
            pt.TxnField.sender, pt.Global.current_application_address()
        ),
        pt.InnerTxnBuilder.SetField(pt.TxnField.fee, pt.Int(0)),
        pt.InnerTxnBuilder.Submit(),
        output.set(pt.Int(1)),
    )


@app.external
def expire(*, output: pt.abi.Uint64) -> pt.Expr:
    return pt.Seq(
        # expired
        pt.Assert(pt.Global.latest_timestamp() >= app.state.expiry.get()),
        # not completed
        pt.Assert(app.state.completed.get() == pt.Int(0)),
        # from the creator
        pt.Assert(app.state.creator.get() == pt.Txn.sender()),
        # ready
        pt.Assert(app.state.ready.get() == pt.Int(1)),
        # complete
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
