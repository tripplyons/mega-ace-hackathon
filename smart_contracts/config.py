import logging

from algokit_utils import (
    Account,
    ApplicationClient,
    ApplicationSpecification,
    OnSchemaBreak,
    OnUpdate,
    OperationPerformed,
    TransferParameters,
    is_localnet,
    transfer,
)
from algosdk.util import algos_to_microalgos
from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient

from . import option

logger = logging.getLogger(__name__)

# define contracts to build and/or deploy
contracts = [option.app]


# define deployment behaviour based on supplied app spec
def deploy(
    algod_client: AlgodClient,
    indexer_client: IndexerClient,
    app_spec: ApplicationSpecification,
    deployer: Account,
) -> None:
    is_local = is_localnet(algod_client)
    match app_spec.contract.name:
        case "Option":
            app_client = ApplicationClient(
                algod_client,
                app_spec,
                creator=deployer,
                indexer_client=indexer_client,
            )

            deploy_response = app_client.deploy(
                on_schema_break=(
                    OnSchemaBreak.ReplaceApp if is_local else OnSchemaBreak.Fail
                ),
                on_update=OnUpdate.UpdateApp if is_local else OnUpdate.Fail,
                allow_delete=is_local,
                allow_update=is_local,
            )

            # if only just created, fund smart contract account
            if deploy_response.action_taken in [
                OperationPerformed.Create,
                OperationPerformed.Replace,
            ]:
                transfer_parameters = TransferParameters(
                    from_account=deployer,
                    to_address=app_client.app_address,
                    micro_algos=algos_to_microalgos(10),
                )
                logger.info(
                    f"New app created, funding with "
                    f"{transfer_parameters.micro_algos}µ algos"
                )
                transfer(algod_client, transfer_parameters)

            def log_state() -> None:
                state = app_client.get_global_state()
                logger.info(
                    f"global state for {app_spec.contract.name} "
                    f"({app_client.app_id}): {state}"
                )

            logger.info(f"deployer address: {deployer.address}")
            logger.info(f"deployer key: {deployer.private_key}")

            log_state()

            # signer = AccountTransactionSigner(deployer.private_key)

            # atc = AtomicTransactionComposer()
            # atc.add_transaction(
            #     TransactionWithSigner(
            #         AssetOptInTxn(
            #             sender=deployer.address,
            #             index=ASA,
            #             sp=algod_client.suggested_params(),
            #         ),
            #         signer,
            #     )
            # )
            # atc.execute(algod_client, wait_rounds=5)

            # sp = algod_client.suggested_params()
            # sp.fee = 2 * sp.min_fee

            # response = app_client.call(
            #     "opt_in_to_asa",
            #     OnCompleteCallParameters(foreign_assets=[ASA], suggested_params=sp),
            # )
            # logger.info(f"opt_in_to_asa response: {response.return_value}")

            # atc = AtomicTransactionComposer()

            # atc.add_transaction(
            #     TransactionWithSigner(
            #         AssetTransferTxn(
            #             sender=deployer.address,
            #             receiver=app_client.app_address,
            #             amt=1,
            #             index=ASA,
            #             sp=algod_client.suggested_params(),
            #         ),
            #         signer,
            #     )
            # )

            # app_client.add_method_call(
            #     atc,
            #     "transfer_asa",
            #     parameters=CommonCallParameters(foreign_assets=[ASA]),
            # )

            # atc.execute(algod_client, wait_rounds=5)

            # log_state()

            # app_client.call(
            #     "cancel",
            #     OnCompleteCallParameters(foreign_assets=[ASA], suggested_params=sp),
            # )

            # log_state()

        case _:
            raise Exception(
                f"Attempt to deploy unknown contract {app_spec.contract.name}"
            )
