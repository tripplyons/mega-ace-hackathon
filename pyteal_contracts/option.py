import pyteal as pt


def approval_program():
    on_creation = pt.Seq(
        [
            pt.App.globalPut(pt.Bytes("creator"), pt.Txn.sender()),
            pt.App.globalPut(pt.Bytes("buyer"), pt.Int(0)),
            pt.App.globalPut(pt.Bytes("expiry"), pt.Int(0)),
            pt.App.globalPut(pt.Bytes("strike"), pt.Int(0)),
            pt.App.globalPut(pt.Bytes("premium"), pt.Int(0)),
            pt.App.globalPut(pt.Bytes("completed"), pt.Int(0)),
            pt.App.globalPut(pt.Bytes("ready"), pt.Int(0)),
            pt.App.globalPut(pt.Bytes("asa"), pt.Int(0)),
            pt.Return(pt.Int(1)),
        ]
    )

    set_params = pt.Seq(
        [
            # from the creator
            pt.Assert(pt.Txn.sender() == pt.App.globalGet(pt.Bytes("creator"))),
            # has ASA
            pt.Assert(pt.Txn.assets.length() == pt.Int(1)),
            # not ready yet
            pt.Assert(pt.App.globalGet(pt.Bytes("ready")) == pt.Int(0)),
            # no params set yet
            pt.Assert(pt.App.globalGet(pt.Bytes("expiry")) == pt.Int(0)),
            # set params
            pt.App.globalPut(
                pt.Bytes("expiry"),
                pt.Global.latest_timestamp() + pt.Btoi(pt.Txn.application_args[0]),
            ),
            pt.App.globalPut(pt.Bytes("strike"), pt.Txn.application_args[1]),
            pt.App.globalPut(pt.Bytes("premium"), pt.Txn.application_args[2]),
            pt.App.globalPut(pt.Bytes("asa"), pt.Txn.assets[0]),
            pt.Return(pt.Int(1)),
        ]
    )

    opt_in_to_asa = pt.Seq(
        [
            # from the creator
            pt.Assert(pt.Txn.sender() == pt.App.globalGet(pt.Bytes("creator"))),
            # has params set
            pt.Assert(pt.App.globalGet(pt.Bytes("expiry")) != pt.Int(0)),
            # not ready yet
            pt.Assert(pt.App.globalGet(pt.Bytes("ready")) == pt.Int(0)),
            # correct ASA
            pt.Assert(pt.App.globalGet(pt.Bytes("asa")) == pt.Txn.assets[0]),
            # opt contract in to ASA
            pt.InnerTxnBuilder.Begin(),
            pt.InnerTxnBuilder.SetField(
                pt.TxnField.type_enum, pt.TxnType.AssetTransfer
            ),
            pt.InnerTxnBuilder.SetField(pt.TxnField.xfer_asset, pt.Txn.assets[0]),
            pt.InnerTxnBuilder.SetField(pt.TxnField.asset_amount, pt.Int(0)),
            pt.InnerTxnBuilder.SetField(
                pt.TxnField.asset_receiver, pt.Global.current_application_address()
            ),
            pt.InnerTxnBuilder.SetField(
                pt.TxnField.sender, pt.Global.current_application_address()
            ),
            pt.InnerTxnBuilder.Submit(),
            pt.Return(pt.Int(1)),
        ]
    )

    transfer_asa = pt.Seq(
        [
            # from the creator
            pt.Assert(pt.Txn.sender() == pt.App.globalGet(pt.Bytes("creator"))),
            # has params set
            pt.Assert(pt.App.globalGet(pt.Bytes("expiry")) != pt.Int(0)),
            # correct ASA
            pt.Assert(pt.Txn.assets.length() == pt.Int(1)),
            pt.Assert(pt.Txn.assets[0] == pt.App.globalGet(pt.Bytes("asa"))),
            # not ready yet
            pt.Assert(pt.App.globalGet(pt.Bytes("ready")) == pt.Int(0)),
            # make sure the ASA is transferred from the creator
            pt.Assert(pt.Global.group_size() == pt.Int(2)),
            pt.Assert(pt.Gtxn[0].type_enum() == pt.TxnType.AssetTransfer),
            pt.Assert(
                pt.Gtxn[0].asset_receiver() == pt.Global.current_application_address()
            ),
            pt.Assert(pt.Gtxn[0].asset_amount() == pt.Int(1)),
            pt.Assert(pt.Gtxn[0].xfer_asset() == pt.App.globalGet(pt.Bytes("asa"))),
            pt.App.globalPut(pt.Bytes("ready"), pt.Int(1)),
            pt.Return(pt.Int(1)),
        ]
    )

    cancel = pt.Seq(
        [
            # from the creator
            pt.Assert(pt.Txn.sender() == pt.App.globalGet(pt.Bytes("creator"))),
            # no buyer yet
            pt.Assert(pt.App.globalGet(pt.Bytes("buyer")) == pt.Itob(pt.Int(0))),
            # not completed
            pt.Assert(pt.App.globalGet(pt.Bytes("completed")) == pt.Int(0)),
            # ready
            pt.Assert(pt.App.globalGet(pt.Bytes("ready")) == pt.Int(1)),
            # correct ASA
            pt.Assert(pt.App.globalGet(pt.Bytes("asa")) == pt.Txn.assets[0]),
            # complete
            pt.App.globalPut(pt.Bytes("completed"), pt.Int(1)),
            # send ASA back to creator
            pt.InnerTxnBuilder.Begin(),
            pt.InnerTxnBuilder.SetField(
                pt.TxnField.type_enum, pt.TxnType.AssetTransfer
            ),
            pt.InnerTxnBuilder.SetField(pt.TxnField.xfer_asset, pt.Txn.assets[0]),
            pt.InnerTxnBuilder.SetField(pt.TxnField.asset_amount, pt.Int(1)),
            pt.InnerTxnBuilder.SetField(
                pt.TxnField.asset_receiver, pt.App.globalGet(pt.Bytes("creator"))
            ),
            pt.InnerTxnBuilder.SetField(
                pt.TxnField.sender, pt.Global.current_application_address()
            ),
            pt.InnerTxnBuilder.SetField(pt.TxnField.fee, pt.Int(0)),
            pt.InnerTxnBuilder.Submit(),
            pt.Return(pt.Int(1)),
        ]
    )

    buy = pt.Seq(
        [
            # paid for the premium
            pt.Assert(pt.Global.group_size() == pt.Int(2)),
            pt.Assert(pt.Gtxn[0].type_enum() == pt.TxnType.Payment),
            pt.Assert(pt.Gtxn[0].amount() == pt.App.globalGet(pt.Bytes("premium"))),
            pt.Assert(pt.Gtxn[0].receiver() == pt.App.globalGet(pt.Bytes("buyer"))),
            # no buyer yet
            pt.Assert(pt.App.globalGet(pt.Bytes("buyer")) == pt.Itob(pt.Int(0))),
            pt.Assert(pt.Txn.sender() != pt.App.globalGet(pt.Bytes("creator"))),
            # not expired
            pt.Assert(
                pt.Global.latest_timestamp() < pt.App.globalGet(pt.Bytes("expiry"))
            ),
            # not completed
            pt.Assert(pt.App.globalGet(pt.Bytes("completed")) == pt.Int(0)),
            # ready
            pt.Assert(pt.App.globalGet(pt.Bytes("ready")) == pt.Int(1)),
            # set buyer
            pt.App.globalPut(pt.Bytes("buyer"), pt.Txn.sender()),
            pt.Return(pt.Int(1)),
        ]
    )

    exercise = pt.Seq(
        [
            # paid for the strike
            pt.Assert(pt.Global.group_size() == pt.Int(2)),
            pt.Assert(pt.Gtxn[0].type_enum() == pt.TxnType.Payment),
            pt.Assert(pt.Gtxn[0].amount() == pt.App.globalGet(pt.Bytes("strike"))),
            pt.Assert(pt.Gtxn[0].receiver() == pt.App.globalGet(pt.Bytes("creator"))),
            # correct buyer
            pt.Assert(pt.App.globalGet(pt.Bytes("buyer")) == pt.Txn.sender()),
            # not expired
            pt.Assert(
                pt.Global.latest_timestamp() < pt.App.globalGet(pt.Bytes("expiry"))
            ),
            # not completed
            pt.Assert(pt.App.globalGet(pt.Bytes("completed")) == pt.Int(0)),
            # ready
            pt.Assert(pt.App.globalGet(pt.Bytes("ready")) == pt.Int(1)),
            # complete
            pt.App.globalPut(pt.Bytes("completed"), pt.Int(1)),
            # send ASA to buyer
            pt.InnerTxnBuilder.Begin(),
            pt.InnerTxnBuilder.SetField(
                pt.TxnField.type_enum, pt.TxnType.AssetTransfer
            ),
            pt.InnerTxnBuilder.SetField(
                pt.TxnField.xfer_asset, pt.App.globalGet(pt.Bytes("asa"))
            ),
            pt.InnerTxnBuilder.SetField(pt.TxnField.asset_amount, pt.Int(1)),
            pt.InnerTxnBuilder.SetField(
                pt.TxnField.asset_receiver, pt.App.globalGet(pt.Bytes("buyer"))
            ),
            pt.InnerTxnBuilder.SetField(
                pt.TxnField.sender, pt.Global.current_application_address()
            ),
            pt.InnerTxnBuilder.SetField(pt.TxnField.fee, pt.Int(0)),
            pt.InnerTxnBuilder.Submit(),
            pt.Return(pt.Int(1)),
        ]
    )

    expire = pt.Seq(
        # expired
        pt.Assert(pt.Global.latest_timestamp() >= pt.App.globalGet(pt.Bytes("expiry"))),
        # not completed
        pt.Assert(pt.App.globalGet(pt.Bytes("completed")) == pt.Int(0)),
        # from the creator
        pt.Assert(pt.App.globalGet(pt.Bytes("creator")) == pt.Txn.sender()),
        # ready
        pt.Assert(pt.App.globalGet(pt.Bytes("ready")) == pt.Int(1)),
        # complete
        pt.App.globalPut(pt.Bytes("completed"), pt.Int(1)),
        # send ASA back to creator
        pt.InnerTxnBuilder.Begin(),
        pt.InnerTxnBuilder.SetField(pt.TxnField.type_enum, pt.TxnType.AssetTransfer),
        pt.InnerTxnBuilder.SetField(
            pt.TxnField.xfer_asset, pt.App.globalGet(pt.Bytes("asa"))
        ),
        pt.InnerTxnBuilder.SetField(pt.TxnField.asset_amount, pt.Int(1)),
        pt.InnerTxnBuilder.SetField(
            pt.TxnField.asset_receiver, pt.App.globalGet(pt.Bytes("creator"))
        ),
        pt.InnerTxnBuilder.SetField(
            pt.TxnField.asset_sender, pt.Global.current_application_address()
        ),
        pt.InnerTxnBuilder.SetField(pt.TxnField.fee, pt.Int(0)),
        pt.InnerTxnBuilder.Submit(),
        pt.Return(pt.Int(1)),
    )

    program = pt.Cond(
        [pt.Txn.application_id() == pt.Int(0), on_creation],
        [pt.Txn.application_args[0] == pt.Bytes("params"), set_params],
        [pt.Txn.application_args[0] == pt.Bytes("opt_in"), opt_in_to_asa],
        [pt.Txn.application_args[0] == pt.Bytes("custody"), transfer_asa],
        [pt.Txn.application_args[0] == pt.Bytes("cancel"), cancel],
        [pt.Txn.application_args[0] == pt.Bytes("buy"), buy],
        [pt.Txn.application_args[0] == pt.Bytes("exercise"), exercise],
        [pt.Txn.application_args[0] == pt.Bytes("expire"), expire],
    )

    return program


def clear_program():
    return pt.Return(pt.Int(1))


if __name__ == "__main__":
    approval = pt.compileTeal(approval_program(), mode=pt.Mode.Application, version=5)
    clear = pt.compileTeal(clear_program(), mode=pt.Mode.Application, version=5)

    from algosdk.v2client.algod import AlgodClient

    algod_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    algod_address = "http://localhost:4001"

    algod = AlgodClient(algod_token, algod_address)

    approval_compiled = algod.compile(approval)["result"]
    clear_compiled = algod.compile(clear)["result"]

    print(approval_compiled)
    print(clear_compiled)
