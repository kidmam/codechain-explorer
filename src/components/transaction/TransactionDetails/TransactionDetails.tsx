import * as _ from "lodash";
import * as React from "react";

import { connect, Dispatch } from "react-redux";
import { Col, Row } from "reactstrap";
import { RootState } from "../../../redux/actions";

import { Buffer } from "buffer";
import { TransactionDoc } from "codechain-indexer-types";
import { Script } from "codechain-sdk/lib/core/classes";
import { Link } from "react-router-dom";
import { changeQuarkStringToCCC } from "../../../utils/Formatter";
import * as Metadata from "../../../utils/Metadata";
import DataSet from "../../util/DataSet/DataSet";
import HexString from "../../util/HexString/HexString";
import { ImageLoader } from "../../util/ImageLoader/ImageLoader";
import { StatusBadge } from "../../util/StatusBadge/StatusBadge";
import { TypeBadge } from "../../util/TypeBadge/TypeBadge";
import "./TransactionDetails.scss";

interface OwnProps {
    transaction: TransactionDoc;
    moveToSectionRef?: string;
}

interface StateProps {
    moveToSectionRef?: string;
}

interface DispatchProps {
    dispatch: Dispatch;
}

interface State {
    pageForInput: number;
    pageForOutput: number;
    pageForBurn: number;
}

type Props = OwnProps & StateProps & DispatchProps;

class TransactionDetailsInternal extends React.Component<Props, State> {
    private itemsPerPage = 6;
    private refList: any = {};
    constructor(props: Props) {
        super(props);
        this.state = {
            pageForInput: 1,
            pageForOutput: 1,
            pageForBurn: 1
        };
    }

    public componentDidUpdate() {
        if (this.props.moveToSectionRef) {
            this.scrollToRef();
        }
    }

    public render() {
        const { transaction } = this.props;
        return (
            <div className="transaction-details">
                <Row>
                    <Col lg="12">
                        <h2>Details</h2>
                        <hr className="heading-hr" />
                    </Col>
                </Row>
                {this.renderTransactionInfo(transaction)}
                {this.renderMoreInfoByType(transaction)}
            </div>
        );
    }

    private getLockScriptName = (lockScriptHash: string) => {
        switch (lockScriptHash) {
            case "5f5960a7bca6ceeeb0c97bc717562914e7a1de04":
                return "P2PKH(0x5f5960a7bca6ceeeb0c97bc717562914e7a1de04)";
            case "37572bdcc22d39a59c0d12d301f6271ba3fdd451":
                return "P2PKHBurn(0x37572bdcc22d39a59c0d12d301f6271ba3fdd451)";
        }
        return `0x${lockScriptHash}`;
    };

    private renderTransactionInfo = (transaction: TransactionDoc) => {
        return (
            <Row key="details">
                <Col lg="12">
                    <DataSet>
                        <Row>
                            <Col md="3">Type</Col>
                            <Col md="9">
                                <TypeBadge transaction={transaction} />
                            </Col>
                        </Row>
                        <hr />
                        <Row>
                            <Col md="3">Block</Col>
                            <Col md="9">
                                <Link to={`/block/${transaction.blockNumber}`}>{transaction.blockNumber}</Link>
                            </Col>
                        </Row>
                        <hr />
                        {!transaction.isPending && [
                            <Row key="index-row">
                                <Col md="3">Transaction Index</Col>
                                <Col md="9">{transaction.transactionIndex!.toLocaleString()}</Col>
                            </Row>,
                            <hr key="index-hr" />
                        ]}
                        <Row>
                            <Col md="3">Sequence</Col>
                            <Col md="9">{transaction.seq}</Col>
                        </Row>
                        <hr />
                        <Row>
                            <Col md="3">Fee</Col>
                            <Col md="9">
                                {changeQuarkStringToCCC(transaction.fee)}
                                CCC
                            </Col>
                        </Row>
                        <hr />
                        <Row>
                            <Col md="3">Signer</Col>
                            <Col md="9">
                                <Link to={`/addr-platform/${transaction.signer}`}>{transaction.signer}</Link>
                            </Col>
                        </Row>
                        <hr />
                        <Row>
                            <Col md="3">NetworkID</Col>
                            <Col md="9">{transaction.networkId}</Col>
                        </Row>
                        <hr />
                        <Row>
                            <Col md="3">Status</Col>
                            <Col md="9">
                                <StatusBadge tx={transaction} />
                            </Col>
                        </Row>
                        <hr />
                        {!transaction.isPending && [
                            <Row key="invoice-row">
                                <Col md="3">Invoice</Col>
                                <Col md="9">{transaction.success ? "Success" : `Fail - ${transaction.errorHint}`}</Col>
                            </Row>,
                            <hr key="invoice-hr" />
                        ]}
                        {this.renderTransactionInfoByType(transaction)}
                    </DataSet>
                </Col>
            </Row>
        );
    };

    private renderTransactionInfoByType = (transaction: TransactionDoc) => {
        if (transaction.type === "transferAsset") {
            return [
                <Row key="row1">
                    <Col md="3"># of Input</Col>
                    <Col md="9">{transaction.transferAsset.inputs.length.toLocaleString()}</Col>
                </Row>,
                <hr key="hr1" />,
                <Row key="row2">
                    <Col md="3"># of Output</Col>
                    <Col md="9">{transaction.transferAsset.outputs.length.toLocaleString()}</Col>
                </Row>,
                <hr key="hr2" />,
                <Row key="row3">
                    <Col md="3"># of Burn</Col>
                    <Col md="9">{transaction.transferAsset.burns.length.toLocaleString()}</Col>
                </Row>,
                <hr key="hr3" />
            ];
        } else if (transaction.type === "mintAsset") {
            return [
                <Row key="row1">
                    <Col md="3">LockScriptHash</Col>
                    <Col md="9">{this.getLockScriptName(transaction.mintAsset.lockScriptHash)}</Col>
                </Row>,
                <hr key="hr1" />,
                <Row key="row2">
                    <Col md="3">Parameters</Col>
                    <Col md="9">
                        <div className="text-area">
                            {_.map(transaction.mintAsset.parameters, (parameter, i) => {
                                return (
                                    <div key={`transaction-heder-param-${i}`}>
                                        {Buffer.from(parameter).toString("hex")}
                                    </div>
                                );
                            })}
                        </div>
                    </Col>
                </Row>,
                <hr key="hr2" />,
                <Row key="row3">
                    <Col md="3">AssetType</Col>
                    <Col md="9">
                        <ImageLoader
                            data={transaction.mintAsset.assetType}
                            size={18}
                            className="mr-2"
                            isAssetImage={true}
                        />
                        <HexString
                            link={`/asset/0x${transaction.mintAsset.assetType}`}
                            text={transaction.mintAsset.assetType}
                        />
                    </Col>
                </Row>,
                <hr key="hr3" />,
                <Row key="row4">
                    <Col md="3">Quantity</Col>
                    <Col md="9">{transaction.mintAsset.supply ? transaction.mintAsset.supply.toLocaleString() : 0}</Col>
                </Row>,
                <hr key="hr4" />,
                <Row key="row5">
                    <Col md="3">Approver</Col>
                    <Col md="9">
                        {transaction.mintAsset.approver ? (
                            <Link to={`/addr-platform/${transaction.mintAsset.approver}`}>
                                {transaction.mintAsset.approver}
                            </Link>
                        ) : (
                            "None"
                        )}
                    </Col>
                </Row>,
                <hr key="hr5" />,
                <Row key="row6">
                    <Col md="3">Recipient</Col>
                    <Col md="9">
                        {transaction.mintAsset.recipient ? (
                            <Link to={`/addr-asset/${transaction.mintAsset.recipient}`}>
                                {transaction.mintAsset.recipient}
                            </Link>
                        ) : (
                            "Unknown"
                        )}
                    </Col>
                </Row>,
                <hr key="hr6" />
            ];
        } else if (transaction.type === "composeAsset") {
            return [
                <Row key="row1">
                    <Col md="3"># of Input</Col>
                    <Col md="9">{transaction.composeAsset.inputs.length.toLocaleString()}</Col>
                </Row>,
                <hr key="hr1" />,
                <Row key="row2">
                    <Col md="3"># of Output</Col>
                    <Col md="9">1</Col>
                </Row>,
                <hr key="hr2" />
            ];
        } else if (transaction.type === "decomposeAsset") {
            return [
                <Row key="row1">
                    <Col md="3"># of Input</Col>
                    <Col md="9">1</Col>
                </Row>,
                <hr key="hr1" />,
                <Row key="row2">
                    <Col md="3"># of Output</Col>
                    <Col md="9">{transaction.decomposeAsset.outputs.length.toLocaleString()}</Col>
                </Row>,
                <hr key="hr2" />
            ];
        } else if (transaction.type === "pay") {
            return [
                <Row key="row1">
                    <Col md="3">Quantity</Col>
                    <Col md="9">
                        {changeQuarkStringToCCC(transaction.pay.quantity)}
                        CCC
                    </Col>
                </Row>,
                <hr key="hr1" />,
                <Row key="row2">
                    <Col md="3">Receiver</Col>
                    <Col md="9">
                        <Link to={`/addr-platform/${transaction.pay.receiver}`}>{transaction.pay.receiver}</Link>
                    </Col>
                </Row>,
                <hr key="hr2" />
            ];
        } else if (transaction.type === "setRegularKey") {
            return [
                <Row key="row1">
                    <Col md="3">Key</Col>
                    <Col md="9">{transaction.setRegularKey.key}</Col>
                </Row>
            ];
        } else if (transaction.type === "store") {
            return [
                <Row key="row1">
                    <Col md="3">Content</Col>
                    <Col md="9">
                        <div className="text-area">{transaction.store.content}</div>
                    </Col>
                </Row>,
                <hr key="hr1" />,
                <Row key="row2">
                    <Col md="3">Certifier</Col>
                    <Col md="9">
                        <Link to={`/addr-asset/${transaction.store.certifier}`}>{transaction.store.certifier}</Link>
                    </Col>
                </Row>,
                <hr key="hr2" />
            ];
        }
        return null;
    };

    private renderMoreInfoByType = (transaction: TransactionDoc) => {
        const { pageForBurn, pageForOutput, pageForInput } = this.state;
        if (transaction.type === "transferAsset") {
            return [
                <div key="input">
                    {_.map(
                        transaction.transferAsset.inputs.slice(0, this.itemsPerPage * pageForInput),
                        (input, index) => {
                            return [
                                <div
                                    key={`transaction-header-table-input-title-${index}`}
                                    className="mt-large"
                                    ref={(re: any) => {
                                        this.refList[`input-${index}`] = re;
                                    }}
                                >
                                    <h3>Input #{index}</h3>
                                    <hr className="heading-hr" />
                                </div>,
                                <Row key={`transaction-header-table-input-detail-${index}`}>
                                    <Col lg="12">
                                        <DataSet>
                                            <Row>
                                                <Col md="3">AssetType</Col>
                                                <Col md="9">
                                                    <ImageLoader
                                                        className="mr-2"
                                                        size={18}
                                                        data={input.prevOut.assetType}
                                                        isAssetImage={true}
                                                    />
                                                    <HexString
                                                        link={`/asset/0x${input.prevOut.assetType}`}
                                                        text={input.prevOut.assetType}
                                                    />
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Owner</Col>
                                                <Col md="9">
                                                    {input.prevOut.owner ? (
                                                        <Link to={`/addr-asset/${input.prevOut.owner}`}>
                                                            {input.prevOut.owner}
                                                        </Link>
                                                    ) : (
                                                        "Unknown"
                                                    )}
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Quantity</Col>
                                                <Col md="9">{input.prevOut.quantity.toLocaleString()}</Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">LockScript</Col>
                                                <Col md="9">
                                                    <div className="text-area">
                                                        {new Script(input.lockScript).toTokens().join(" ")}
                                                    </div>
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">UnlockScript</Col>
                                                <Col md="9">
                                                    <div className="text-area">
                                                        {new Script(input.unlockScript).toTokens().join(" ")}
                                                    </div>
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Prev Tx</Col>
                                                <Col md="9">
                                                    <HexString
                                                        link={`/tx/0x${input.prevOut.tracker}`}
                                                        text={input.prevOut.tracker}
                                                    />
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Prev Tx Index</Col>
                                                <Col md="9">{input.prevOut.index.toLocaleString()}</Col>
                                            </Row>
                                            <hr />
                                        </DataSet>
                                    </Col>
                                </Row>
                            ];
                        }
                    )}
                    {this.itemsPerPage * pageForInput < transaction.transferAsset.inputs.length ? (
                        <Row>
                            <Col>
                                <div className="mt-small">
                                    <button className="btn btn-primary w-100" onClick={this.loadMoreInput}>
                                        Load Input
                                    </button>
                                </div>
                            </Col>
                        </Row>
                    ) : null}
                </div>,
                <div key="burn">
                    {_.map(transaction.transferAsset.burns.slice(0, this.itemsPerPage * pageForBurn), (burn, index) => {
                        return [
                            <div
                                key={`transaction-header-table-burn-title-${index}`}
                                className="mt-large"
                                ref={(re: any) => {
                                    this.refList[`burn-${index}`] = re;
                                }}
                            >
                                <h3>Burn #{index}</h3>
                                <hr className="heading-hr" />
                            </div>,
                            <Row key={`transaction-header-table-burn-detail-${index}`}>
                                <Col lg="12">
                                    <DataSet>
                                        <Row>
                                            <Col md="3">AssetType</Col>
                                            <Col md="9">
                                                <ImageLoader
                                                    className="mr-2"
                                                    size={18}
                                                    data={burn.prevOut.assetType}
                                                    isAssetImage={true}
                                                />
                                                <HexString
                                                    link={`/asset/0x${burn.prevOut.assetType}`}
                                                    text={burn.prevOut.assetType}
                                                />
                                            </Col>
                                        </Row>
                                        <hr />
                                        <Row>
                                            <Col md="3">Owner</Col>
                                            <Col md="9">
                                                {burn.prevOut.owner ? (
                                                    <Link to={`/addr-asset/${burn.prevOut.owner}`}>
                                                        {burn.prevOut.owner}
                                                    </Link>
                                                ) : (
                                                    "Unknown"
                                                )}
                                            </Col>
                                        </Row>
                                        <hr />
                                        <Row>
                                            <Col md="3">Quantity</Col>
                                            <Col md="9">{burn.prevOut.quantity.toLocaleString()}</Col>
                                        </Row>
                                        <hr />
                                        <Row>
                                            <Col md="3">LockScript</Col>
                                            <Col md="9">
                                                <div className="text-area">
                                                    {new Script(burn.lockScript).toTokens().join(" ")}
                                                </div>
                                            </Col>
                                        </Row>
                                        <hr />
                                        <Row>
                                            <Col md="3">UnlockScript</Col>
                                            <Col md="9">
                                                <div className="text-area">
                                                    {new Script(burn.unlockScript).toTokens().join(" ")}
                                                </div>
                                            </Col>
                                        </Row>
                                        <hr />
                                        <Row>
                                            <Col md="3">Prev Tx</Col>
                                            <Col md="9">
                                                <HexString
                                                    link={`/tx/0x${burn.prevOut.tracker}`}
                                                    text={burn.prevOut.tracker}
                                                />
                                            </Col>
                                        </Row>
                                        <hr />
                                        <Row>
                                            <Col md="3">Prev Tx Index</Col>
                                            <Col md="9">{burn.prevOut.index.toLocaleString()}</Col>
                                        </Row>
                                        <hr />
                                    </DataSet>
                                </Col>
                            </Row>
                        ];
                    })}
                    {this.itemsPerPage * pageForBurn < transaction.transferAsset.burns.length ? (
                        <Row>
                            <Col>
                                <div className="mt-small">
                                    <button className="btn btn-primary w-100" onClick={this.loadMoreBurn}>
                                        Load Burn
                                    </button>
                                </div>
                            </Col>
                        </Row>
                    ) : null}
                </div>,
                <div key="output">
                    {_.map(
                        transaction.transferAsset.outputs.slice(0, this.itemsPerPage * pageForOutput),
                        (output, index) => {
                            return [
                                <div
                                    key={`transaction-header-table-output-title-${index}`}
                                    className="mt-large"
                                    ref={(re: any) => {
                                        this.refList[`output-${index}`] = re;
                                    }}
                                >
                                    <h3>Output #{index}</h3>
                                    <hr className="heading-hr" />
                                </div>,
                                <Row key={`transaction-header-table-output-details-${index}`}>
                                    <Col lg="12">
                                        <DataSet>
                                            <Row>
                                                <Col md="3">AssetType</Col>
                                                <Col md="9">
                                                    <ImageLoader
                                                        size={18}
                                                        data={output.assetType}
                                                        className="mr-2"
                                                        isAssetImage={true}
                                                    />
                                                    <HexString
                                                        link={`/asset/0x${output.assetType}`}
                                                        text={output.assetType}
                                                    />
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Owner</Col>
                                                <Col md="9">
                                                    {output.owner ? (
                                                        <Link to={`/addr-asset/${output.owner}`}>{output.owner}</Link>
                                                    ) : (
                                                        "Unknown"
                                                    )}
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Quantity</Col>
                                                <Col md="9">{output.quantity.toLocaleString()}</Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">LockScriptHash</Col>
                                                <Col md="9">{this.getLockScriptName(output.lockScriptHash)}</Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Parameters</Col>
                                                <Col md="9">
                                                    <div className="text-area">
                                                        {_.map(output.parameters, (parameter, i) => {
                                                            return (
                                                                <div key={`transaction-paramter-${i}`}>
                                                                    {Buffer.from(parameter).toString("hex")}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </Col>
                                            </Row>
                                            <hr />
                                        </DataSet>
                                    </Col>
                                </Row>
                            ];
                        }
                    )}
                    {this.itemsPerPage * pageForOutput < transaction.transferAsset.outputs.length ? (
                        <Row>
                            <Col>
                                <div className="mt-small">
                                    <button className="btn btn-primary w-100" onClick={this.loadMoreOutput}>
                                        Load Output
                                    </button>
                                </div>
                            </Col>
                        </Row>
                    ) : null}
                </div>
            ];
        } else if (transaction.type === "mintAsset") {
            const metadata = Metadata.parseMetadata(transaction.mintAsset.metadata);
            return [
                <Row key="metadata">
                    <Col lg="12" className="mt-large">
                        <h2>Metadata</h2>
                        <hr className="heading-hr" />
                    </Col>
                </Row>,
                <Row key="metadata-detail">
                    <Col lg="12">
                        <DataSet>
                            <Row>
                                <Col md="3">Name</Col>
                                <Col md="9">{metadata.name ? metadata.name : "None"}</Col>
                            </Row>
                            <hr />
                            <Row>
                                <Col md="3">Description</Col>
                                <Col md="9">
                                    <div className="text-area">
                                        {metadata.description ? metadata.description : "None"}
                                    </div>
                                </Col>
                            </Row>
                            <hr />
                            <Row>
                                <Col md="3">Icon</Col>
                                <Col md="9">
                                    <div className="text-area">{metadata.icon_url ? metadata.icon_url : "None"}</div>
                                </Col>
                            </Row>
                            <hr />
                            <Row>
                                <Col md="3">Raw data</Col>
                                <Col md="9">
                                    <div className="text-area">{transaction.mintAsset.metadata}</div>
                                </Col>
                            </Row>
                            <hr />
                        </DataSet>
                    </Col>
                </Row>
            ];
        } else if (transaction.type === "composeAsset") {
            return [
                <div key="input">
                    {_.map(
                        transaction.composeAsset.inputs.slice(0, this.itemsPerPage * pageForInput),
                        (input, index) => {
                            return [
                                <div
                                    key={`transaction-header-table-input-title-${index}`}
                                    className="mt-large"
                                    ref={(re: any) => {
                                        this.refList[`input-${index}`] = re;
                                    }}
                                >
                                    <h3>Input #{index}</h3>
                                    <hr className="heading-hr" />
                                </div>,
                                <Row key={`transaction-header-table-input-detail-${index}`}>
                                    <Col lg="12">
                                        <DataSet>
                                            <Row>
                                                <Col md="3">AssetType</Col>
                                                <Col md="9">
                                                    <ImageLoader
                                                        className="mr-2"
                                                        size={18}
                                                        data={input.prevOut.assetType}
                                                        isAssetImage={true}
                                                    />
                                                    <HexString
                                                        link={`/asset/0x${input.prevOut.assetType}`}
                                                        text={input.prevOut.assetType}
                                                    />
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Owner</Col>
                                                <Col md="9">
                                                    {input.prevOut.owner ? (
                                                        <Link to={`/addr-asset/${input.prevOut.owner}`}>
                                                            {input.prevOut.owner}
                                                        </Link>
                                                    ) : (
                                                        "Unknown"
                                                    )}
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Quantity</Col>
                                                <Col md="9">{input.prevOut.quantity.toLocaleString()}</Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">LockScript</Col>
                                                <Col md="9">
                                                    <div className="text-area">
                                                        {new Script(input.lockScript).toTokens().join(" ")}
                                                    </div>
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">UnlockScript</Col>
                                                <Col md="9">
                                                    <div className="text-area">
                                                        {new Script(input.unlockScript).toTokens().join(" ")}
                                                    </div>
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Prev Tx</Col>
                                                <Col md="9">
                                                    <HexString
                                                        link={`/tx/0x${input.prevOut.tracker}`}
                                                        text={input.prevOut.tracker}
                                                    />
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Prev Tx Index</Col>
                                                <Col md="9">{input.prevOut.index.toLocaleString()}</Col>
                                            </Row>
                                            <hr />
                                        </DataSet>
                                    </Col>
                                </Row>
                            ];
                        }
                    )}
                    {this.itemsPerPage * pageForInput < transaction.composeAsset.inputs.length ? (
                        <Row>
                            <Col>
                                <div className="mt-small">
                                    <button className="btn btn-primary w-100" onClick={this.loadMoreInput}>
                                        Load Input
                                    </button>
                                </div>
                            </Col>
                        </Row>
                    ) : null}
                </div>,
                <div key="output">
                    <div
                        className="mt-large"
                        ref={(re: any) => {
                            this.refList[`output-0`] = re;
                        }}
                    >
                        <h3>Output</h3>
                        <hr className="heading-hr" />
                    </div>
                    <Row>
                        <Col lg="12">
                            <DataSet>
                                <Row>
                                    <Col md="3">AssetType</Col>
                                    <Col md="9">
                                        <ImageLoader
                                            size={18}
                                            data={transaction.composeAsset.assetType}
                                            className="mr-2"
                                            isAssetImage={true}
                                        />
                                        <HexString
                                            link={`/asset/0x${transaction.composeAsset.assetType}`}
                                            text={transaction.composeAsset.assetType}
                                        />
                                    </Col>
                                </Row>
                                <hr />
                                <Row>
                                    <Col md="3">Recipient</Col>
                                    <Col md="9">
                                        {transaction.composeAsset.recipient ? (
                                            <Link to={`/addr-asset/${transaction.composeAsset.recipient}`}>
                                                {transaction.composeAsset.recipient}
                                            </Link>
                                        ) : (
                                            "Unknown"
                                        )}
                                    </Col>
                                </Row>
                                <hr />
                                <Row>
                                    <Col md="3">Quantity</Col>
                                    <Col md="9">{transaction.composeAsset.supply}</Col>
                                </Row>
                                <hr />
                                <Row>
                                    <Col md="3">LockScriptHash</Col>
                                    <Col md="9">{this.getLockScriptName(transaction.composeAsset.lockScriptHash)}</Col>
                                </Row>
                                <hr />
                                <Row>
                                    <Col md="3">Parameters</Col>
                                    <Col md="9">
                                        <div className="text-area">
                                            {_.map(transaction.composeAsset.parameters, (parameter, i) => {
                                                return (
                                                    <div key={`transaction-paramter-${i}`}>
                                                        {Buffer.from(parameter).toString("hex")}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Col>
                                </Row>
                                <hr />
                            </DataSet>
                        </Col>
                    </Row>
                </div>
            ];
        } else if (transaction.type === "decomposeAsset") {
            return [
                <div key="input">
                    <div
                        className="mt-large"
                        ref={(re: any) => {
                            this.refList[`input-0`] = re;
                        }}
                    >
                        <h3>Input</h3>
                        <hr className="heading-hr" />
                    </div>
                    <Row>
                        <Col lg="12">
                            <DataSet>
                                <Row>
                                    <Col md="3">AssetType</Col>
                                    <Col md="9">
                                        <ImageLoader
                                            className="mr-2"
                                            size={18}
                                            data={transaction.decomposeAsset.input.prevOut.assetType}
                                            isAssetImage={true}
                                        />
                                        <HexString
                                            link={`/asset/0x${transaction.decomposeAsset.input.prevOut.assetType}`}
                                            text={transaction.decomposeAsset.input.prevOut.assetType}
                                        />
                                    </Col>
                                </Row>
                                <hr />
                                <Row>
                                    <Col md="3">Owner</Col>
                                    <Col md="9">
                                        {transaction.decomposeAsset.input.prevOut.owner ? (
                                            <Link to={`/addr-asset/${transaction.decomposeAsset.input.prevOut.owner}`}>
                                                {transaction.decomposeAsset.input.prevOut.owner}
                                            </Link>
                                        ) : (
                                            "Unknown"
                                        )}
                                    </Col>
                                </Row>
                                <hr />
                                <Row>
                                    <Col md="3">Quantity</Col>
                                    <Col md="9">{transaction.decomposeAsset.input.prevOut.quantity}</Col>
                                </Row>
                                <hr />
                                <Row>
                                    <Col md="3">LockScript</Col>
                                    <Col md="9">
                                        <div className="text-area">
                                            {new Script(transaction.decomposeAsset.input.lockScript)
                                                .toTokens()
                                                .join(" ")}
                                        </div>
                                    </Col>
                                </Row>
                                <hr />
                                <Row>
                                    <Col md="3">UnlockScript</Col>
                                    <Col md="9">
                                        <div className="text-area">
                                            {new Script(transaction.decomposeAsset.input.unlockScript)
                                                .toTokens()
                                                .join(" ")}
                                        </div>
                                    </Col>
                                </Row>
                                <hr />
                                <Row>
                                    <Col md="3">Prev Tx</Col>
                                    <Col md="9">
                                        <HexString
                                            link={`/tx/0x${transaction.decomposeAsset.input.prevOut.tracker}`}
                                            text={transaction.decomposeAsset.input.prevOut.tracker}
                                        />
                                    </Col>
                                </Row>
                                <hr />
                                <Row>
                                    <Col md="3">Prev Tx Index</Col>
                                    <Col md="9">{transaction.decomposeAsset.input.prevOut.index.toLocaleString()}</Col>
                                </Row>
                                <hr />
                            </DataSet>
                        </Col>
                    </Row>
                </div>,
                <div key="output">
                    {_.map(
                        transaction.decomposeAsset.outputs.slice(0, this.itemsPerPage * pageForOutput),
                        (output, index) => {
                            return [
                                <div
                                    key={`transaction-header-table-output-title-${index}`}
                                    className="mt-large"
                                    ref={(re: any) => {
                                        this.refList[`output-${index}`] = re;
                                    }}
                                >
                                    <h3>Output #{index}</h3>
                                    <hr className="heading-hr" />
                                </div>,
                                <Row key={`transaction-header-table-output-details-${index}`}>
                                    <Col lg="12">
                                        <DataSet>
                                            <Row>
                                                <Col md="3">AssetType</Col>
                                                <Col md="9">
                                                    <ImageLoader
                                                        size={18}
                                                        data={output.assetType}
                                                        className="mr-2"
                                                        isAssetImage={true}
                                                    />
                                                    <HexString
                                                        link={`/asset/0x${output.assetType}`}
                                                        text={output.assetType}
                                                    />
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Owner</Col>
                                                <Col md="9">
                                                    {output.owner ? (
                                                        <Link to={`/addr-asset/${output.owner}`}>{output.owner}</Link>
                                                    ) : (
                                                        "Unknown"
                                                    )}
                                                </Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Quantity</Col>
                                                <Col md="9">{output.quantity.toLocaleString()}</Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">LockScriptHash</Col>
                                                <Col md="9">{this.getLockScriptName(output.lockScriptHash)}</Col>
                                            </Row>
                                            <hr />
                                            <Row>
                                                <Col md="3">Parameters</Col>
                                                <Col md="9">
                                                    <div className="text-area">
                                                        {_.map(output.parameters, (parameter, i) => {
                                                            return (
                                                                <div key={`transaction-paramter-${i}`}>
                                                                    {Buffer.from(parameter).toString("hex")}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </Col>
                                            </Row>
                                            <hr />
                                        </DataSet>
                                    </Col>
                                </Row>
                            ];
                        }
                    )}
                    {this.itemsPerPage * pageForOutput < transaction.decomposeAsset.outputs.length ? (
                        <Row>
                            <Col>
                                <div className="mt-small">
                                    <button className="btn btn-primary w-100" onClick={this.loadMoreOutput}>
                                        Load Output
                                    </button>
                                </div>
                            </Col>
                        </Row>
                    ) : null}
                </div>
            ];
        }
        return null;
    };

    private scrollToRef = () => {
        const ref = this.props.moveToSectionRef;
        if (ref) {
            const domNode = this.refList[ref];
            if (domNode) {
                if (window.innerWidth <= 991) {
                    window.scrollTo(0, domNode.offsetTop - 120);
                } else {
                    window.scrollTo(0, domNode.offsetTop - 70);
                }
            }
        }
        this.props.dispatch({
            type: "MOVE_TO_SECTION",
            data: undefined
        });
    };

    private loadMoreInput = () => {
        this.setState({ pageForInput: this.state.pageForInput + 1 });
    };

    private loadMoreBurn = () => {
        this.setState({ pageForBurn: this.state.pageForBurn + 1 });
    };

    private loadMoreOutput = () => {
        this.setState({ pageForOutput: this.state.pageForOutput + 1 });
    };
}

const TransactionDetails = connect((state: RootState) => {
    const { moveToSectionRef } = state.appReducer;
    return {
        moveToSectionRef
    };
})(TransactionDetailsInternal);

export default TransactionDetails;
