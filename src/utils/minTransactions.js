function getMax(amounts) {
  let maxIndex = -1;
  let maxBalance = -Infinity;
  for (let i = 0; i < amounts.length; i++) {
    if (amounts[i].balance > maxBalance) {
      maxBalance = amounts[i].balance;
      maxIndex = i;
    }
  }
  return maxIndex;
}

function getMin(amounts) {
  let minIndex = -1;
  let minBalance = Infinity;
  for (let i = 0; i < amounts.length; i++) {
    if (amounts[i].balance < minBalance) {
      minBalance = amounts[i].balance;
      minIndex = i;
    }
  }
  return minIndex;
}

function minimum(val1, val2) {
  return val1 < val2 ? val1 : val2;
}

function minTransaction(amounts, transactions) {
  let maxCredit = getMax(amounts);
  let maxDebit = getMin(amounts);

  if (
    maxCredit === -1 ||
    maxDebit === -1 ||
    amounts[maxCredit].balance === 0 ||
    amounts[maxDebit].balance === 0
  ) {
    return;
  }

  let minAmount = minimum(
    amounts[maxCredit].balance,
    Math.abs(amounts[maxDebit].balance),
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
