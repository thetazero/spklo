import { describe, it, expect } from 'vitest'
import { createEngine, Engine } from './main'
import type { Match } from './types'

describe('createEngine', () => {
  it('should correctly update ELOs for a single match', () => {
    // Create a simple match where Player A and Player B beat Player C and Player D
    const match: Match = {
      winner: new Set(['PlayerA', 'PlayerB']),
      loser: new Set(['PlayerC', 'PlayerD'])
    }

    const result = createEngine([match], 32)

    // All players should start at 1000 ELO
    // Since teams are evenly matched (both 2000 total), expected win probability is 50%
    // ELO change = K * (1 - 0.5) = 32 * 0.5 = 16

    // Winners should gain ~16 ELO, losers should lose ~16 ELO
    expect(result.engine.getElo('PlayerA')).toBeCloseTo(1016, 0)
    expect(result.engine.getElo('PlayerB')).toBeCloseTo(1016, 0)
    expect(result.engine.getElo('PlayerC')).toBeCloseTo(984, 0)
    expect(result.engine.getElo('PlayerD')).toBeCloseTo(984, 0)

    // Should have one analyzed match
    expect(result.analyzedMatches).toHaveLength(1)

    const analysis = result.analyzedMatches[0]
    expect(analysis.winTeam).toEqual(match.winner)
    expect(analysis.loseTeam).toEqual(match.loser)
    expect(analysis.expectedWinProbability).toBeCloseTo(0.5, 2)
    expect(analysis.eloChange).toBeCloseTo(16, 0)
  })

  it('should handle multiple matches in sequence', () => {
    const matches: Match[] = [
      {
        winner: new Set(['PlayerA', 'PlayerB']),
        loser: new Set(['PlayerC', 'PlayerD'])
      },
      {
        winner: new Set(['PlayerA', 'PlayerC']),
        loser: new Set(['PlayerB', 'PlayerD'])
      }
    ]

    const result = createEngine(matches, 32)

    // Should have two analyzed matches
    expect(result.analyzedMatches).toHaveLength(2)

    // After match 1: A=1016, B=1016, C=984, D=984
    // After match 2: A=1032, B=1000, C=1000, D=968
    expect(result.engine.getElo('PlayerA')).toBeCloseTo(1032, 0)
    expect(result.engine.getElo('PlayerB')).toBeCloseTo(1000, 0)
    expect(result.engine.getElo('PlayerC')).toBeCloseTo(1000, 0)
    expect(result.engine.getElo('PlayerD')).toBeCloseTo(968, 0)
  })

  it('should return correct match analysis structure including beforeElos', () => {
    const match: Match = {
      winner: new Set(['Alice', 'Bob']),
      loser: new Set(['Charlie', 'Diana'])
    }

    const result = createEngine([match], 32)
    const analysis = result.analyzedMatches[0]

    // Verify basic structure
    expect(analysis).toBeDefined()
    expect(analysis.winTeam).toEqual(match.winner)
    expect(analysis.loseTeam).toEqual(match.loser)

    // Verify ELO calculations
    expect(analysis.eloChange).toBeCloseTo(16, 0)
    expect(analysis.expectedWinProbability).toBeCloseTo(0.5, 2)

    // Verify beforeElos contains all players with starting ELO
    expect(analysis.beforeElos).toBeDefined()
    expect(analysis.beforeElos['Alice']).toBe(1000)
    expect(analysis.beforeElos['Bob']).toBe(1000)
    expect(analysis.beforeElos['Charlie']).toBe(1000)
    expect(analysis.beforeElos['Diana']).toBe(1000)

    // Verify final ELOs are updated correctly
    expect(result.engine.getElo('Alice')).toBeCloseTo(1016, 0)
    expect(result.engine.getElo('Bob')).toBeCloseTo(1016, 0)
    expect(result.engine.getElo('Charlie')).toBeCloseTo(984, 0)
    expect(result.engine.getElo('Diana')).toBeCloseTo(984, 0)
  })

  it('should track beforeElos correctly across multiple matches', () => {
    const matches: Match[] = [
      {
        winner: new Set(['Alice', 'Bob']),
        loser: new Set(['Charlie', 'Diana'])
      },
      {
        winner: new Set(['Alice', 'Charlie']),
        loser: new Set(['Bob', 'Diana'])
      }
    ]

    const result = createEngine(matches, 32)

    // First match - all players start at 1000
    const firstAnalysis = result.analyzedMatches[0]
    expect(firstAnalysis.beforeElos['Alice']).toBe(1000)
    expect(firstAnalysis.beforeElos['Bob']).toBe(1000)

    // Second match - Alice and Charlie should have updated ELOs from first match
    const secondAnalysis = result.analyzedMatches[1]
    expect(secondAnalysis.beforeElos['Alice']).toBeCloseTo(1016, 0) // Won first match
    expect(secondAnalysis.beforeElos['Charlie']).toBeCloseTo(984, 0) // Lost first match
  })
})

describe('Engine', () => {
  it('should return default ELO of 1000 for unknown players', () => {
    const engine = new Engine(32)
    expect(engine.getElo('UnknownPlayer')).toBe(1000)
  })

  it('should calculate combined team ELO correctly', () => {
    const engine = new Engine(32)
    engine.elos['PlayerA'] = 1200
    engine.elos['PlayerB'] = 1300

    const teamElo = engine.getCombinedElo(new Set(['PlayerA', 'PlayerB']))
    expect(teamElo).toBe(2500)
  })
})
