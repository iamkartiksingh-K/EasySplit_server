function getMax(amounts) {
	let maxIndex = 0;
	for (let i = 0; i < amounts.length; i++) {
		if (amounts[i].balance > amounts[maxIndex].balance) maxIndex = i;
	}
	return maxIndex;
}
function getMin(amounts) {
	let minIndex = 0;
	for (let i = 0; i < amounts.length; i++) {
		if (amounts[i].balance < amounts[minIndex].balance) minIndex = i;
	}
	return minIndex;
}
function minimum(val1, val2) {
	return val1 < val2 ? val1 : val2;
}
// amounts[i]=[{balance:number, username:string}]
function minTransaction(amounts, transactions) {
	let maxCredit = getMax(amounts);
	let maxDebit = getMin(amounts);

	if (!amounts[maxCredit].balance && !amounts[maxDebit].balance) {
		return;
	}
	let minAmount = minimum(
		amounts[maxCredit].balance,
		Math.abs(amounts[maxDebit].balance)
	);
	amounts[maxCredit].balance -= minAmount;
	amounts[maxDebit].balance += minAmount;
	transactions.push({
		from: amounts[maxDebit].username,
		to: amounts[maxCredit].username,
		amount: minAmount,
	});
	minTransaction(amounts, transactions);
}
export default minTransaction;
