const ROWS_SIZE = 9;
const COLUMN_SIZE = 9;
const SMALL_SQUARE_SIZE = 3;

const ALL_FIELDS_NUMBER = ROWS_SIZE * COLUMN_SIZE;

const printSudoku = (matrix) => {
	const result = [];

	for (let i = 0; i < 9; i++) {
		let str = '';
		if (i % 3 === 0) {
			result.push(' ');
		}

		for (j = 0; j < 9; j++) {
			const currentValue = matrix[i][j];
			if (Array.isArray(currentValue)) {
				str += `[${currentValue}]           `;
			} else {
				str += currentValue + '                ';
			}
		}
		result.push(str);
	}

	return result;
};

// metadata
let rowsMetadata = [];
let columnsMetadata = [];
let smallSquaresMetadata = [];

const resetMetadata = () => {
	rowsMetadata = [];
	columnsMetadata = [];
	smallSquaresMetadata = [];
	for (let i = 0; i < ROWS_SIZE; i++) {
		rowsMetadata[i] = { unknown: {} };
		columnsMetadata[i] = { unknown: {} };
		smallSquaresMetadata[i] = { unknown: {} };
	}
};

const isArray = (value) => Array.isArray(value);
const isNumberField = (field) => !isArray(field) && field >= 1 && field <= 9;

const solveSudoku = (matrix) => {
	// possible numbers
	const initialUnknown = [];

	// fill in with 1-9
	for (let i = 0; i < ROWS_SIZE; i++) {
		initialUnknown.push(i + 1);
	}

	resetMetadata();

	const getSmallSquareMetadata = (rowIndex, columnIndex) => {
		const r1 = Math.floor(rowIndex / SMALL_SQUARE_SIZE);
		const c1 = Math.floor(columnIndex / SMALL_SQUARE_SIZE);

		return smallSquaresMetadata[r1 * SMALL_SQUARE_SIZE + c1];
	};
	const setSquareMetadata = (rowIndex, columnIndex, value) => {
		const metadata = getSmallSquareMetadata(rowIndex, columnIndex);
		const unknownId = rowIndex + columnIndex;
		if (!isArray[value]) {
			metadata[value] = true;
			if (metadata.unknown[unknownId]) {
				delete metadata.unknown[unknownId];
			}
		} else {
			metadata.unknown[unknownId] = value;
		}
	};

	const tranformArrayFieldToNumberIfNeeded = (fieldValue) => {
		if (isArray(fieldValue) && fieldValue.length === 1) {
			return fieldValue[0];
		}

		return fieldValue;
	};

	const updateMetadata = (rowIndex, columnIndex) => {
		const value = matrix[rowIndex][columnIndex];

		if (isNumberField(value)) {
			rowsMetadata[rowIndex][value] = true;
			delete rowsMetadata[rowIndex].unknown[columnIndex];

			columnsMetadata[columnIndex][value] = true;
			delete columnsMetadata[columnIndex].unknown[rowIndex];
		} else {
			rowsMetadata[rowIndex].unknown[columnIndex] = value;
			columnsMetadata[columnIndex].unknown[rowIndex] = value;
		}

		setSquareMetadata(rowIndex, columnIndex, value);
	};

	const recalculateMetadata = () => {
		resetMetadata();

		for (let i = 0; i < ROWS_SIZE; i++) {
			for (let j = 0; j < COLUMN_SIZE; j++) {
				updateMetadata(i, j);
			}
		}
	};

	const getHashFromArray = (arr) =>
		arr.reduce((acc, value) => {
			acc[value] = true;
			return acc;
		}, {});

	const getSubstractionSetsResult = (givenArray, arrays) => {
		const givenHash = getHashFromArray(givenArray);

		arrays.forEach((arr) => {
			arr.forEach((val) => {
				delete givenHash[val];
			});
		});

		return Object.keys(givenHash);
	};

	const resolveWithMetadata = (rowIndex, columnIndex) => {
		let result = matrix[rowIndex][columnIndex];

		if (isNumberField(result)) {
			return result;
		}

		// CHECK ROW CONDITION
		result = tranformArrayFieldToNumberIfNeeded(result.filter((x) => !rowsMetadata[rowIndex][x]));
		if (isNumberField(result)) {
			return result;
		}

		const setSubstraction = getSubstractionSetsResult(
			result,
			Object.keys(rowsMetadata[rowIndex].unknown)
				.filter((x) => +x !== columnIndex)
				.map((x) => rowsMetadata[rowIndex].unknown[x])
		);

		if (setSubstraction.length === 1) {
			result = tranformArrayFieldToNumberIfNeeded(setSubstraction[0]);
			if (isNumberField(result)) {
				return result;
			}
		}

		// CHECK COLUMN CONDITION
		result = tranformArrayFieldToNumberIfNeeded(result.filter((x) => !columnsMetadata[columnIndex][x]));
		if (isNumberField(result)) {
			return result;
		}

		const setSubstractionColumn = getSubstractionSetsResult(
			result,
			Object.keys(columnsMetadata[columnIndex].unknown)
				.filter((x) => +x !== rowIndex)
				.map((x) => columnsMetadata[columnIndex].unknown[x])
		);

		if (setSubstractionColumn.length === 1) {
			result = tranformArrayFieldToNumberIfNeeded(setSubstractionColumn[0]);
			if (isNumberField(result)) {
				return result;
			}
		}

		// CHECK SMALL SQUARES CONDITION
		const squareMetadata = getSmallSquareMetadata(rowIndex, columnIndex);
		result = tranformArrayFieldToNumberIfNeeded(result.filter((x) => !squareMetadata[x]));
		if (isNumberField(result)) {
			return result;
		}

		const unknownId = rowIndex + columnIndex;
		const setSubstractionSquares = getSubstractionSetsResult(
			result,
			Object.keys(squareMetadata.unknown).filter((x) => +x !== unknownId).map((x) => squareMetadata.unknown[x])
		);

		if (setSubstractionSquares.length === 1) {
			result = tranformArrayFieldToNumberIfNeeded(setSubstractionSquares[0]);
			if (isNumberField(result)) {
				return result;
			}
		}

		return result;
	};

	const parseMatrixByRules = () => {
		let isInitialized = false;
		let numbersCount = 0;

		// 1 - fill in 0 field with array field with possible solution numbers
		while (true) {
			let resolvedNumbersCount = 0;
			numbersCount = 0;
			// basic algorithm
			for (let i = 0; i < ROWS_SIZE; i++) {
				if (!rowsMetadata[i]) {
					rowsMetadata[i] = {};
				}

				for (let j = 0; j < COLUMN_SIZE; j++) {
					// handle field
					if (!isNumberField(matrix[i][j])) {
						// try to solve by conditions
						if (matrix[i][j] === 0) {
							matrix[i][j] = initialUnknown;
						}

						if (isInitialized) {
							// solve with metadata
							const result = resolveWithMetadata(i, j);
							matrix[i][j] = result;

							if (isArray(result) && result.length === 0) {
								throw new Error('The matrix is invalid. Please fix it.');
							}

							const isResolved = isNumberField(matrix[i][j]);

							if (isResolved) {
								resolvedNumbersCount++;
							}
						}
					} else {
						numbersCount++;
					}

					updateMetadata(i, j);
				}
			}

			if (numbersCount === ALL_FIELDS_NUMBER || (isInitialized && !resolvedNumbersCount)) {
				break;
			}

			previousResolvedNumbersCount = resolvedNumbersCount;
			isInitialized = true;
		}

		return numbersCount;
	};

	let numbersCount = parseMatrixByRules();

	if (numbersCount === ALL_FIELDS_NUMBER) {
		return matrix;
	}

	const stack = [];

	// start new algorithm
	// parse rows pairs (50%)
	while (true) {
		//refactor block
		const rowsPairs = rowsMetadata
			.map((x, index) => ({
				rowIndex: index,
				unknown: x.unknown
			}))
			.filter((x) => Object.keys(x.unknown).length > 0)
			.map((x) => ({
				rowIndex: x.rowIndex,
				pairs: Object.keys(x.unknown).map((k2) => ({ columnIndex: k2, value: x.unknown[k2] }))
			}));
		const pairs = [];

		rowsPairs.forEach((x) => {
			x.pairs.forEach((y) => {
				if (y.value.length === 2) {
					pairs.push({
						rowIndex: +x.rowIndex,
						columnIndex: +y.columnIndex,
						pair: y.value
					});
				}
			});
		});

		const firstPair = pairs.length > 0 ? pairs[0] : null;

		if (!firstPair) {
			break;
		}

		stack.push({ rowIndex: firstPair.rowIndex, columnIndex: firstPair.columnIndex, value: firstPair.pair[0] });

		const previousArray = matrix.map((x) => [ ...x ]);

		matrix[firstPair.rowIndex][firstPair.columnIndex] = firstPair.pair[0];
		updateMetadata(firstPair.rowIndex, firstPair.columnIndex);

		let result;
		try {
			result = parseMatrixByRules();
		} catch (error) {
			matrix = previousArray;
			recalculateMetadata();
			stack.pop();
			matrix[firstPair.rowIndex][firstPair.columnIndex] = firstPair.pair[1];
			updateMetadata(firstPair.rowIndex, firstPair.columnIndex);
			stack.push({ rowIndex: firstPair.rowIndex, columnIndex: firstPair.columnIndex, value: firstPair.pair[1] });
		}

		if (result > numbersCount) {
			numbersCount = result;
		}
	}
	// end new algorithm

	return matrix;
};

const initial = [
	[ 0, 0, 4, 0, 5, 0, 0, 0, 0 ],
	[ 3, 5, 0, 0, 0, 0, 6, 9, 7 ],
	[ 6, 7, 0, 0, 0, 0, 0, 0, 0 ],
	[ 4, 0, 0, 6, 8, 0, 0, 0, 0 ],
	[ 0, 6, 0, 0, 0, 0, 0, 8, 0 ],
	[ 0, 8, 0, 5, 0, 0, 3, 0, 0 ],
	[ 0, 3, 0, 9, 0, 0, 7, 0, 5 ],
	[ 0, 4, 0, 8, 0, 0, 0, 0, 9 ],
	[ 0, 0, 0, 0, 0, 3, 0, 1, 0 ]
];

module.exports = solveSudoku;
