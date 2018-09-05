import { filter } from 'lodash'
import {
  orderColumnsToString,
  limitAndOffsetToString,
  keysetPagingSelect,
  interpretForOffsetPaging,
  interpretForKeysetPaging,
  generateCastExpressionFromValueType
} from '../shared'

const dialect = module.exports = {
  name: 'mssql',

  quote(str) {
    return `[${str}]`
  },

  asIndicator() {
    return 'AS'
  },

  compositeKey(parent, keys) {
    keys = keys.map(key => `[${parent}].[${key}]`)
    return `NULLIF(CONCAT(${keys.join(', ')}), '')`
  },

  handleJoinedOneToManyPaginated: async function(parent, node, context, tables, joinCondition) {
    const pagingWhereConditions = [
      await node.sqlJoin(`[${parent.as}]`, `[${node.as}]`, node.args || {}, context, node)
    ]
    if (node.where) {
      pagingWhereConditions.push(
        await node.where(`[${node.as}]`, node.args || {}, context, node)
      )
    }

    // which type of pagination are they using?
    if (node.sortKey) {
      const { limit, order, whereCondition: whereAddendum } = interpretForKeysetPaging(node, dialect)
      pagingWhereConditions.push(whereAddendum)
      tables.push(
        keysetPagingSelect(node.name,
          pagingWhereConditions, order, limit,
          node.as, {
            joinCondition,
            joinType: 'LEFT',
            q: this.quote,
            asIndicator: this.asIndicator(),
            dialectName: this.name
          })
      )
    } else if (node.orderBy) {
      const { limit, offset, order } = interpretForOffsetPaging(node, dialect)
      tables.push(
        this.offsetPagingSelect(node.name, pagingWhereConditions, order, limit, offset, node.as, {
          joinCondition,
          joinType: 'LEFT',
          dialectName: this.name,
          q: this.quote
        })
      )
    }
  },

  handleBatchedManyToManyPaginated: async function(parent, node, context, tables, batchScope, joinCondition) {
    const thisKeyOperand = generateCastExpressionFromValueType(
      `[${node.junction.as}].[${node.junction.sqlBatch.thisKey.name}]`, batchScope[0]
    )
    const pagingWhereConditions = [
      `${thisKeyOperand} = temp.[${node.junction.sqlBatch.parentKey.name}]`
    ]
    if (node.junction.where) {
      pagingWhereConditions.push(
        await node.junction.where(`[${node.junction.as}]`, node.args || {}, context, node)
      )
    }
    if (node.where) {
      pagingWhereConditions.push(
        await node.where(`[${node.as}]`, node.args || {}, context, node)
      )
    }

    const tempTable = `FROM (VALUES ${batchScope.map(val => `(${val})`)}) temp([${node.junction.sqlBatch.parentKey.name}])`
    tables.push(tempTable)
    const lateralJoinCondition = `${thisKeyOperand} = temp.[${node.junction.sqlBatch.parentKey.name}]`

    const lateralJoinOptions = {
      joinCondition: lateralJoinCondition,
      joinType: 'LEFT',
      q: this.quote,
      asIndicator: this.asIndicator(),
      dialectName: this.name
    }

    if (node.where || node.orderBy) {
      lateralJoinOptions.extraJoin = {
        name: node.name,
        as: node.as,
        condition: joinCondition
      }
    }
    if (node.sortKey || node.junction.sortKey) {
      const { limit, order, whereCondition: whereAddendum } = interpretForKeysetPaging(node, dialect)
      pagingWhereConditions.push(whereAddendum)
      tables.push(
        keysetPagingSelect(node.junction.sqlTable, pagingWhereConditions, order, limit, node.junction.as, lateralJoinOptions)
      )
    } else if (node.orderBy || node.junction.orderBy) {
      const { limit, offset, order } = interpretForOffsetPaging(node, dialect)
      tables.push(
        this.offsetPagingSelect(
          node.junction.sqlTable, pagingWhereConditions, order,
          limit, offset, node.junction.as, lateralJoinOptions
        )
      )
    }
    tables.push(`LEFT JOIN ${node.name} AS [${node.as}] ON ${joinCondition}`)
  },

  handleJoinedManyToManyPaginated: async function(parent, node, context, tables, joinCondition1, joinCondition2) {
    const pagingWhereConditions = [
      await node.junction.sqlJoins[0](`[${parent.as}]`, `[${node.junction.as}]`, node.args || {}, context, node)
    ]
    if (node.junction.where) {
      pagingWhereConditions.push(
        await node.junction.where(`[${node.junction.as}]`, node.args || {}, context, node)
      )
    }
    if (node.where) {
      pagingWhereConditions.push(
        await node.where(`[${node.as}]`, node.args || {}, context, node)
      )
    }

    const lateralJoinOptions = {
      joinCondition: joinCondition1,
      joinType: 'LEFT',
      q: this.quote,
      asIndicator: this.asIndicator(),
      dialectName: this.name
    }

    if (node.where || node.orderBy) {
      lateralJoinOptions.extraJoin = {
        name: node.name,
        as: node.as,
        condition: joinCondition2
      }
    }
    if (node.sortKey || node.junction.sortKey) {
      const { limit, order, whereCondition: whereAddendum } = interpretForKeysetPaging(node, dialect)
      pagingWhereConditions.push(whereAddendum)
      tables.push(
        keysetPagingSelect(node.junction.sqlTable, pagingWhereConditions, order, limit, node.junction.as, lateralJoinOptions)
      )
    } else if (node.orderBy || node.junction.orderBy) {
      const { limit, offset, order } = interpretForOffsetPaging(node, dialect)
      tables.push(
        this.offsetPagingSelect(
          node.junction.sqlTable, pagingWhereConditions, order,
          limit, offset, node.junction.as, lateralJoinOptions
        )
      )
    }
  },

  handlePaginationAtRoot: async function(parent, node, context, tables) {
    const pagingWhereConditions = []
    if (node.sortKey) {
      const { limit, order, whereCondition: whereAddendum } = interpretForKeysetPaging(node, dialect)
      pagingWhereConditions.push(whereAddendum)
      if (node.where) {
        pagingWhereConditions.push(
          await node.where(`[${node.as}]`, node.args || {}, context, node)
        )
      }
      tables.push(
        keysetPagingSelect(
          node.name,
          pagingWhereConditions,
          order, limit,
          node.as,
          {
            q: this.quote,
            asIndicator: this.asIndicator(),
            dialectName: this.name
          })
      )
    } else if (node.orderBy) {
      const { limit, offset, order } = interpretForOffsetPaging(node, dialect)
      if (node.where) {
        pagingWhereConditions.push(
          await node.where(`[${node.as}]`, node.args || {}, context, node)
        )
      }
      tables.push(
        this.offsetPagingSelect(node.name, pagingWhereConditions, order, limit, offset, node.as, { q: this.quote, dialectName: this.name })
      )
    }
  },

  handleBatchedOneToManyPaginated: async function(parent, node, context, tables, batchScope) {
    const thisKeyOperand = generateCastExpressionFromValueType(`[${node.as}].[${node.sqlBatch.thisKey.name}]`, batchScope[0])
    const pagingWhereConditions = [
      `${thisKeyOperand} = temp.[${node.sqlBatch.parentKey.name}]`
    ]
    if (node.where) {
      pagingWhereConditions.push(
        await node.where(`[${node.as}]`, node.args || {}, context, node)
      )
    }
    const tempTable = `FROM (VALUES ${batchScope.map(val => `(${val})`)}) temp([${node.sqlBatch.parentKey.name}])`
    tables.push(tempTable)
    const lateralJoinCondition = `${thisKeyOperand} = temp.[${node.sqlBatch.parentKey.name}]`
    if (node.sortKey) {
      const { limit, order, whereCondition: whereAddendum } = interpretForKeysetPaging(node, dialect)
      pagingWhereConditions.push(whereAddendum)
      tables.push(
        keysetPagingSelect(
          node.name,
          pagingWhereConditions,
          order,
          limit,
          node.as,
          {
            joinCondition: lateralJoinCondition,
            q: this.quote,
            asIndicator: this.asIndicator(),
            dialectName: this.name
          })
      )
    } else if (node.orderBy) {
      const { limit, offset, order } = interpretForOffsetPaging(node, dialect)
      tables.push(
        this.offsetPagingSelect(node.name, pagingWhereConditions, order, limit, offset, node.as, {
          joinCondition: lateralJoinCondition,
          dialectName: this.name,
          q: this.quote
        })
      )
    }
  },

  offsetPagingSelect: function(table, pagingWhereConditions, order, limit, offset, as, options = {}) {
    let { joinCondition, joinType, extraJoin, dialectName } = options
    const q = this.quote
    const whereCondition = filter(pagingWhereConditions).join(' AND ') || '1>0'
    if (joinCondition) {
      return `\
      CROSS APPLY (
          SELECT ${q(as)}.*, count(*) OVER () AS ${q('$total')}
          FROM ${table} ${q(as)}
          ${extraJoin ? `LEFT JOIN ${extraJoin.name} ${q(extraJoin.as)}
            ON ${extraJoin.condition}` : ''}
          WHERE ${whereCondition}
          ORDER BY ${orderColumnsToString(order.columns, q, order.table)}
          ${limitAndOffsetToString(limit, offset, dialectName)}
        ) ${q(as)}${dialectName == 'mssql' ? '' : ` ON ${joinCondition}`}`
    }
    return `\
      FROM (
        SELECT ${q(as)}.*, count(*) OVER () AS ${q('$total')}
        FROM ${table} ${q(as)}
        WHERE ${whereCondition}
        ORDER BY ${orderColumnsToString(order.columns, q, order.table)}
        ${limitAndOffsetToString(limit, offset, dialectName)}
      ) ${q(as)}`
  }
}
