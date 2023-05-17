import Transaction from "../model/Transaction.js";

const transactions = [
    { id: 1, amount: 100, status: 'successful', type: 'receivable', createdAt: 'January 1, 2021' },
    { id: 2, amount: 250, status: 'successful', type: 'payable', createdAt: 'January 15, 2021' },
    { id: 3, amount: 50, status: 'failed', type: 'receivable', createdAt: 'February 1, 2021' },
    { id: 4, amount: 300, status: 'successful', type: 'payable', createdAt: 'February 15, 2021' },
    { id: 5, amount: 75, status: 'successful', type: 'receivable', createdAt: 'March 1, 2021' },
    { id: 6, amount: 400, status: 'failed', type: 'payable', createdAt: 'March 15, 2021' },
    { id: 7, amount: 200, status: 'successful', type: 'receivable', createdAt: 'April 1, 2021' },
    { id: 8, amount: 125, status: 'successful', type: 'payable', createdAt: 'April 15, 2021' },
    { id: 9, amount: 350, status: 'failed', type: 'receivable', createdAt: 'May 1, 2021' },
    { id: 10, amount: 500, status: 'successful', type: 'payable', createdAt: 'May 15, 2021' },
    { id: 11, amount: 150, status: 'successful', type: 'receivable', createdAt: 'June 1, 2021' },
    { id: 12, amount: 225, status: 'failed', type: 'payable', createdAt: 'June 15, 2021' },
    { id: 13, amount: 100, status: 'successful', type: 'receivable', createdAt: 'July 1, 2021' },
    { id: 14, amount: 250, status: 'successful', type: 'payable', createdAt: 'July 15, 2021' },
    { id: 15, amount: 50, status: 'failed', type: 'receivable', createdAt: 'August 1, 2021' },
    { id: 16, amount: 300, status: 'successful', type: 'payable', createdAt: 'August 15, 2021' },
    { id: 17, amount: 75, status: 'successful', type: 'receivable', createdAt: 'September 1, 2021' },
    { id: 18, amount: 400, status: 'failed', type: 'payable', createdAt: 'September 15, 2021' },
    { id: 19, amount: 200, status: 'successful', type: 'receivable', createdAt: 'October 1, 2021' },
    { id: 20, amount: 125, status: 'successful', type: 'payable', createdAt: 'October 15, 2021' },
]

// get my transactions
const my_transactions = async (request, response) => {

    const userId = request.user._id;
    const { period } = request.params;

    console.log(userId, period)

    let startDate = new Date();
    let endDate = new Date();

    switch (period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'yesterday':
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(endDate.getDate() - 1);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'week':
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'month':
            startDate.setDate(startDate.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'all':
            startDate = new Date(0);
            break;
    }

    try {
        const transactions = await Transaction.find({
            user: userId,
            createdAt: { $gte: startDate, $lte: endDate },
        });

        console.log(startDate, endDate)
        response.json(transactions);
    } catch (err) {
        response.status(500).json({ message: err.message });
    }
};

// get transaction for this month
const transaction_chart = async (request, response) => {
    try {

        const summary = {};
        const currentYear = 2021 // new Date().getFullYear();
        for (let i = 0; i < 12; i++) {
            summary[i] = {
                receivable: 0,
                payable: 0
            };
        }

        for (const transaction of transactions) {
            const createdAt = new Date(transaction.createdAt);
            const year = createdAt.getFullYear();
            if (year === currentYear) {
                const month = createdAt.getMonth();
                if (transaction.type === 'receivable') {
                    summary[month].receivable += transaction.amount;
                } else if (transaction.type === 'payable') {
                    summary[month].payable += transaction.amount;
                }
            }
        }

        const receivables = [];
        const payable = [];
        for (let [key, value] of Object.entries(summary)) {
            receivables.push(value.receivable);
            payable.push(value.payable);
        }
        response.status(200).json({ receivables, payable });
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Server Error " });
    }
};

// get all transaction from the current week
const current_week_transactions = async (request, response) => {
    try {
        // find all transaction from this week - solution one (1)
        // const currentWeekStart = new Date().setDate(new Date().getDate() - new Date().getDay());
        // const currentWeekEnd = new Date(currentWeekStart);
        // currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

        // const transactions = await Transaction.find({ date: { $gte: currentWeekStart, $lt: currentWeekEnd } });

        // response.status(200).json(transactions);
        // solution two (2)
        const transactions = [
            { "amount": 500, "createdAt": "2022-12-01", "type": "receivable" },
            { "amount": 100, "createdAt": "2022-12-05", "type": "payable" },
            { "amount": 200, "createdAt": "2022-12-07", "type": "receivable" },
            { "amount": 150, "createdAt": "2022-12-10", "type": "payable" },
            { "amount": 75, "createdAt": "2022-12-15", "type": "receivable" },
            { "amount": 250, "createdAt": "2022-12-20", "type": "payable" },
            { "amount": 325, "createdAt": "2022-12-22", "type": "receivable" }
        ];

        const currentDate = new Date();
        const currentWeekStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
        const currentWeekEnd = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + 6);

        const filterTransactions = (transactions, startDate, endDate, types) => {
            return transactions.filter(t => {
                const createdAt = new Date(t.createdAt);
                return startDate <= createdAt && createdAt <= endDate && types.includes(t.type)
            });
        };

        const receivablePayableTransactions = filterTransactions(transactions, currentWeekStart, currentWeekEnd, ["receivable", "payable"]);

        console.log(receivablePayableTransactions);
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Server Error " });
    }
};

const get_transaction_by_query = async (request, response) => {
    const { searchStr } = request.params;

    try {
        const transactions = await Transaction.find(
            {
                user: request.user._id, narration: { $regex: searchStr, $options: 'i' }
            })
            .sort({ createdAt: -1 })
            .limit(5);


        response.status(200).json(transactions)
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Server Error " });
    }
}


export {
    my_transactions,
    transaction_chart,
    current_week_transactions,
    get_transaction_by_query
}