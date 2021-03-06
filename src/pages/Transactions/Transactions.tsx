import { faAngleDoubleLeft, faAngleDoubleRight, faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as _ from "lodash";
import * as moment from "moment";
import * as React from "react";
import { Redirect } from "react-router";
import { Container } from "reactstrap";

import { TransactionDoc } from "codechain-indexer-types";
import { Link } from "react-router-dom";
import DataTable from "../../components/util/DataTable/DataTable";
import HexString from "../../components/util/HexString/HexString";
import { TypeBadge } from "../../components/util/TypeBadge/TypeBadge";
import { RequestTotalTransactionCount, RequestTransactions } from "../../request";
import { changeQuarkStringToCCC } from "../../utils/Formatter";
import "./Transactions.scss";

interface State {
    transactions: TransactionDoc[];
    totalTransactionCount?: number;
    isTransactionRequested: boolean;
    redirect: boolean;
    redirectPage?: number;
    redirectItemsPerPage?: number;
}

interface Props {
    location: {
        search: string;
    };
}

class Transactions extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            transactions: [],
            totalTransactionCount: undefined,
            isTransactionRequested: false,
            redirect: false,
            redirectItemsPerPage: undefined,
            redirectPage: undefined
        };
    }

    public componentWillReceiveProps(props: Props) {
        const {
            location: { search }
        } = this.props;
        const {
            location: { search: nextSearch }
        } = props;
        if (nextSearch !== search) {
            this.setState({
                transactions: [],
                isTransactionRequested: false,
                redirect: false,
                redirectPage: undefined,
                redirectItemsPerPage: undefined
            });
        }
    }

    public render() {
        const {
            location: { search }
        } = this.props;
        const params = new URLSearchParams(search);
        const currentPage = params.get("page") ? parseInt(params.get("page") as string, 10) : 1;
        const itemsPerPage = params.get("itemsPerPage") ? parseInt(params.get("itemsPerPage") as string, 10) : 25;
        const {
            transactions,
            totalTransactionCount,
            isTransactionRequested,
            redirect,
            redirectItemsPerPage,
            redirectPage
        } = this.state;

        if (redirect) {
            return (
                <Redirect
                    push={true}
                    to={`/txs?page=${redirectPage || currentPage}&itemsPerPage=${redirectItemsPerPage || itemsPerPage}`}
                />
            );
        }
        if (totalTransactionCount === undefined) {
            return (
                <RequestTotalTransactionCount
                    onTransactionTotalCount={this.onTotalTransactionCount}
                    onError={this.onError}
                />
            );
        }
        const maxPage = Math.floor(Math.max(0, totalTransactionCount - 1) / itemsPerPage) + 1;
        return (
            <Container className="transactions animated fadeIn">
                {!isTransactionRequested ? (
                    <RequestTransactions
                        onTransactions={this.onTransactions}
                        page={currentPage}
                        itemsPerPage={itemsPerPage}
                        onError={this.onError}
                    />
                ) : null}
                <div className="d-flex align-items-end">
                    <div>
                        <h1>Latest transactions</h1>
                        <div>
                            <div className="d-flex mt-small">
                                <div className="d-inline ml-auto pager">
                                    <ul className="list-inline">
                                        <li className="list-inline-item">
                                            <button
                                                disabled={currentPage === 1 || !isTransactionRequested}
                                                className={`btn btn-primary page-btn ${
                                                    currentPage === 1 ? "disabled" : ""
                                                }`}
                                                type="button"
                                                onClick={_.partial(this.moveFirst, currentPage)}
                                            >
                                                <FontAwesomeIcon icon={faAngleDoubleLeft} />
                                            </button>
                                        </li>
                                        <li className="list-inline-item">
                                            <button
                                                disabled={currentPage === 1 || !isTransactionRequested}
                                                className={`btn btn-primary page-btn ${
                                                    currentPage === 1 ? "disabled" : ""
                                                }`}
                                                type="button"
                                                onClick={_.partial(this.moveBefore, currentPage)}
                                            >
                                                <FontAwesomeIcon icon={faAngleLeft} /> Prev
                                            </button>
                                        </li>
                                        <li className="list-inline-item">
                                            <div className="number-view">
                                                {currentPage} of {maxPage}
                                            </div>
                                        </li>
                                        <li className="list-inline-item">
                                            <button
                                                disabled={currentPage === maxPage || !isTransactionRequested}
                                                className={`btn btn-primary page-btn ${
                                                    currentPage === maxPage ? "disabled" : ""
                                                }`}
                                                type="button"
                                                onClick={_.partial(this.moveNext, currentPage, maxPage)}
                                            >
                                                Next <FontAwesomeIcon icon={faAngleRight} />
                                            </button>
                                        </li>
                                        <li className="list-inline-item">
                                            <button
                                                disabled={currentPage === maxPage || !isTransactionRequested}
                                                className={`btn btn-primary page-btn ${
                                                    currentPage === maxPage ? "disabled" : ""
                                                }`}
                                                type="button"
                                                onClick={_.partial(this.moveLast, currentPage, maxPage)}
                                            >
                                                <FontAwesomeIcon icon={faAngleDoubleRight} />
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="ml-auto mb-3">
                        <span>Show </span>
                        <select onChange={this.handleOptionChange} defaultValue={itemsPerPage.toString()}>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="75">75</option>
                            <option value="100">100</option>
                        </select>
                        <span> entries</span>
                    </div>
                </div>
                <div className="transaction-table">
                    <div>
                        <div>
                            <DataTable>
                                <thead>
                                    <tr>
                                        <th style={{ width: "20%" }}>Type</th>
                                        <th style={{ width: "25%" }}>Hash</th>
                                        <th style={{ width: "15%" }} className="text-right">
                                            Fee
                                        </th>
                                        <th style={{ width: "25%" }}>Signer</th>
                                        <th style={{ width: "15%" }} className="text-right">
                                            Last seen
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {_.map(transactions, transaction => {
                                        return (
                                            <tr key={`transaction-${transaction.hash}`}>
                                                <td>
                                                    <TypeBadge transaction={transaction} />{" "}
                                                </td>
                                                <td scope="row">
                                                    <HexString
                                                        link={`/tx/0x${transaction.hash}`}
                                                        text={transaction.hash}
                                                    />
                                                </td>
                                                <td className="text-right">
                                                    {changeQuarkStringToCCC(transaction.fee)}
                                                    CCC
                                                </td>
                                                <td>
                                                    <Link to={`/addr-platform/${transaction.signer}`}>
                                                        {transaction.signer}
                                                    </Link>
                                                </td>
                                                <td className="text-right">
                                                    {moment.unix(transaction.timestamp!).fromNow()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </DataTable>
                        </div>
                    </div>
                </div>
            </Container>
        );
    }

    private moveNext = (currentPage: number, maxPage: number, e: any) => {
        e.preventDefault();
        if (currentPage >= maxPage) {
            return;
        }
        this.setState({ redirectPage: currentPage + 1, redirect: true });
    };

    private moveLast = (currentPage: number, maxPage: number, e: any) => {
        e.preventDefault();
        if (currentPage >= maxPage) {
            return;
        }
        this.setState({ redirectPage: maxPage, redirect: true });
    };

    private moveBefore = (currentPage: number, e: any) => {
        e.preventDefault();
        if (currentPage <= 1) {
            return;
        }
        this.setState({ redirectPage: currentPage - 1, redirect: true });
    };

    private moveFirst = (currentPage: number, e: any) => {
        if (currentPage <= 1) {
            return;
        }
        this.setState({ redirectPage: 1, redirect: true });
    };

    private handleOptionChange = (event: any) => {
        const selected = parseInt(event.target.value, 10);
        this.setState({
            redirectItemsPerPage: selected,
            redirect: true,
            redirectPage: 1
        });
    };

    private onTotalTransactionCount = (totalTransactionCount: number) => {
        this.setState({ totalTransactionCount });
    };

    private onTransactions = (transactions: TransactionDoc[]) => {
        this.setState({ transactions, isTransactionRequested: true });
    };

    private onError = (error: any) => {
        console.log(error);
    };
}

export default Transactions;
