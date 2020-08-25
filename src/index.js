const fs = require('fs')

const calculateDurations = (operations) => {
	const durations = operations.map((el) => el.duration)
	const totalDuration = durations.reduce((acc, value) => acc + value)

	return {
		avg: (totalDuration / operations.length).toFixed(6),
		max: Math.max(...durations).toFixed(6),
		min: Math.min(...durations).toFixed(6),
	}
}

console.log('Heart Beat Medical Logs-Processor STARTED')

try {
	const logData = fs.readFileSync('src/logs.log', 'utf8')

	console.log('Finished reading logs sucessfully')

	const logLinesArray = logData.split('\n').filter((el) => el.includes('operation-responsetime'))

	const allOperations = logLinesArray.map((line) => {
		const operation = {
			type: line.slice(line.indexOf('operationType: ') + 15),
			name: line.slice(line.indexOf('operation: ') + 11, line.indexOf('duration') - 3),
			duration: Number(line.slice(line.indexOf('duration: ') + 10, line.indexOf('operationType') - 3)),
		}

		return operation
	})

	let operationNames = allOperations.map((el) => el.name)
	operationNames = Array.from(new Set(operationNames))

	let operationTypes = allOperations.map((el) => el.type)
	operationTypes = Array.from(new Set(operationTypes))

	let insertValuesSQL = ''
	const typeOperationsArray = []
	const operationsArray = []

	operationTypes.forEach((type) => {
		const typeOperations = allOperations.filter((el) => el.type === type)
		const typeDurations = calculateDurations(typeOperations)

		let typedOperationNames = typeOperations.map((el) => el.name)
		typedOperationNames = Array.from(new Set(typedOperationNames))

		typeOperationsArray.push({
			type,
			count: typeOperations.length,
			avg: typeDurations.avg,
			max: typeDurations.max,
			min: typeDurations.min,
		})

		typedOperationNames.forEach((name) => {
			const ops = typeOperations.filter((el) => el.name === name)
			const opDurations = calculateDurations(ops)

			operationsArray.push({
				operation: name,
				count: ops.length,
				avg: opDurations.avg,
				max: opDurations.max,
				min: opDurations.min,
			})

			Object.keys(opDurations).forEach((method) => {
				insertValuesSQL += `(NOW(), '${name}', '${type.toUpperCase()}', ${opDurations[method]}, '${method.toUpperCase()}'),\n`
			})
		})
	})

	const wholeInsertQuery = `insert into GraphqlDurations\n(created, operation, operationType, duration, method)\nvalues\n${insertValuesSQL}`

	fs.writeFileSync('src/insertQuery.txt', wholeInsertQuery, 'utf8')

	console.log('typeOperationsArray', typeOperationsArray)
	console.log('operationNames length', operationNames.length)
	console.log('operationsArray', operationsArray)
} catch (e) {
	console.error('Error:', e.stack)
}
