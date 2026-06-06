import { describe, it, expect } from "vitest";
import {
  moneyToPoints,
  pointsToMoney,
  round2,
  computeBalances,
  computeSettlements,
  settlementMismatch,
  totalChipsInPlay,
  totalFinalChips,
  type TxInput,
} from "./poker";

describe("conversión dinero <-> puntos", () => {
  it("convierte dinero a puntos con el rate", () => {
    expect(moneyToPoints(10, 100)).toBe(1000);
    expect(moneyToPoints(5.5, 100)).toBe(550);
    expect(moneyToPoints(20, 50)).toBe(1000);
  });

  it("convierte puntos a dinero con el rate", () => {
    expect(pointsToMoney(1000, 100)).toBe(10);
    expect(pointsToMoney(550, 100)).toBe(5.5);
    expect(pointsToMoney(1500, 100)).toBe(15);
  });

  it("es seguro con rate inválido", () => {
    expect(moneyToPoints(10, 0)).toBe(0);
    expect(pointsToMoney(10, 0)).toBe(0);
  });

  it("ida y vuelta consistente", () => {
    expect(pointsToMoney(moneyToPoints(10, 100), 100)).toBe(10);
  });
});

describe("round2", () => {
  it("redondea a 2 decimales", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(5.555)).toBe(5.56);
  });
});

describe("computeBalances — partida simple", () => {
  it("dos jugadores, uno gana lo que el otro pierde", () => {
    const tx: TxInput[] = [
      { type: "buy_in", playerId: "A", money: 10, points: 1000 },
      { type: "buy_in", playerId: "B", money: 10, points: 1000 },
    ];
    const balances = computeBalances({
      playerIds: ["A", "B"],
      transactions: tx,
      finalChips: { A: 1500, B: 500 },
      rate: 100,
    });
    const a = balances.find((b) => b.playerId === "A")!;
    const b = balances.find((b) => b.playerId === "B")!;
    expect(a.netMoneyIn).toBe(10);
    expect(a.balance).toBe(5); // 1500/100 - 10
    expect(b.balance).toBe(-5); // 500/100 - 10
    expect(settlementMismatch(balances)).toBe(0);
  });
});

describe("computeBalances — recompras a la mesa (bote)", () => {
  it("varios buy-in del mismo jugador se acumulan", () => {
    const tx: TxInput[] = [
      { type: "buy_in", playerId: "A", money: 10, points: 1000 },
      { type: "buy_in", playerId: "A", money: 10, points: 1000 }, // recompra al bote
      { type: "buy_in", playerId: "B", money: 10, points: 1000 },
    ];
    const balances = computeBalances({
      playerIds: ["A", "B"],
      transactions: tx,
      finalChips: { A: 1000, B: 2000 },
      rate: 100,
    });
    const a = balances.find((b) => b.playerId === "A")!;
    const b = balances.find((b) => b.playerId === "B")!;
    expect(a.netMoneyIn).toBe(20);
    expect(a.balance).toBe(-10); // 1000/100 - 20
    expect(b.balance).toBe(10); // 2000/100 - 10
    expect(settlementMismatch(balances)).toBe(0);
  });
});

describe("computeBalances — recompra ENTRE jugadores (transfer)", () => {
  it("el comprador paga al vendedor y recibe sus fichas", () => {
    const tx: TxInput[] = [
      { type: "buy_in", playerId: "A", money: 10, points: 1000 },
      { type: "buy_in", playerId: "B", money: 10, points: 1000 },
      // A compra 500 fichas a B por 5 €
      {
        type: "transfer",
        playerId: "A",
        counterpartyId: "B",
        money: 5,
        points: 500,
      },
    ];
    const balances = computeBalances({
      playerIds: ["A", "B"],
      transactions: tx,
      // A tiene ahora 1500 de ledger, B tiene 500 de ledger
      finalChips: { A: 1500, B: 500 },
      rate: 100,
    });
    const a = balances.find((b) => b.playerId === "A")!;
    const b = balances.find((b) => b.playerId === "B")!;
    expect(a.chipsLedger).toBe(1500); // 1000 + 500
    expect(b.chipsLedger).toBe(500); // 1000 - 500
    expect(a.netMoneyIn).toBe(15); // 10 + 5
    expect(b.netMoneyIn).toBe(5); // 10 - 5
    expect(a.balance).toBe(0); // 1500/100 - 15
    expect(b.balance).toBe(0); // 500/100 - 5
    expect(settlementMismatch(balances)).toBe(0);
  });
});

describe("conservación de fichas", () => {
  it("las transferencias no crean ni destruyen fichas", () => {
    const tx: TxInput[] = [
      { type: "buy_in", playerId: "A", money: 10, points: 1000 },
      { type: "buy_in", playerId: "B", money: 10, points: 1000 },
      {
        type: "transfer",
        playerId: "A",
        counterpartyId: "B",
        money: 5,
        points: 500,
      },
    ];
    const balances = computeBalances({
      playerIds: ["A", "B"],
      transactions: tx,
      finalChips: { A: 1500, B: 500 },
      rate: 100,
    });
    expect(totalChipsInPlay(balances)).toBe(2000);
    expect(totalFinalChips(balances)).toBe(2000);
  });
});

describe("computeSettlements", () => {
  it("caso simple: un deudor paga a un acreedor", () => {
    const pays = computeSettlements([
      { playerId: "A", balance: 5 },
      { playerId: "B", balance: -5 },
    ]);
    expect(pays).toEqual([{ from: "B", to: "A", amount: 5 }]);
  });

  it("minimiza pagos con varios jugadores", () => {
    // A +30, B +10, C -25, D -15  => total 0
    const pays = computeSettlements([
      { playerId: "A", balance: 30 },
      { playerId: "B", balance: 10 },
      { playerId: "C", balance: -25 },
      { playerId: "D", balance: -15 },
    ]);
    // el total pagado debe cubrir exactamente lo adeudado
    const totalPaid = pays.reduce((s, p) => s + p.amount, 0);
    expect(round2(totalPaid)).toBe(40);
    // cada jugador recibe/paga su balance neto
    const net: Record<string, number> = {};
    for (const p of pays) {
      net[p.to] = round2((net[p.to] ?? 0) + p.amount);
      net[p.from] = round2((net[p.from] ?? 0) - p.amount);
    }
    expect(net["A"]).toBe(30);
    expect(net["B"]).toBe(10);
    expect(net["C"]).toBe(-25);
    expect(net["D"]).toBe(-15);
    // greedy: como mucho (deudores + acreedores - 1) pagos
    expect(pays.length).toBeLessThanOrEqual(3);
  });

  it("no genera pagos si todo está cuadrado a cero", () => {
    expect(
      computeSettlements([
        { playerId: "A", balance: 0 },
        { playerId: "B", balance: 0 },
      ]),
    ).toEqual([]);
  });

  it("ignora céntimos por debajo del epsilon", () => {
    const pays = computeSettlements([
      { playerId: "A", balance: 0.005 },
      { playerId: "B", balance: -0.005 },
    ]);
    expect(pays).toEqual([]);
  });
});

describe("flujo completo end-to-end", () => {
  it("partida de 3 con recompras mixtas cuadra y liquida bien", () => {
    const tx: TxInput[] = [
      { type: "buy_in", playerId: "A", money: 20, points: 2000 },
      { type: "buy_in", playerId: "B", money: 20, points: 2000 },
      { type: "buy_in", playerId: "C", money: 20, points: 2000 },
      // C se queda sin fichas y recompra 10€ al bote
      { type: "buy_in", playerId: "C", money: 10, points: 1000 },
      // B compra 1000 fichas a A por 10€
      {
        type: "transfer",
        playerId: "B",
        counterpartyId: "A",
        money: 10,
        points: 1000,
      },
    ];
    // total fichas en juego = 2000*3 + 1000 = 7000
    const balances = computeBalances({
      playerIds: ["A", "B", "C"],
      transactions: tx,
      finalChips: { A: 0, B: 4000, C: 3000 },
      rate: 100,
    });
    expect(totalChipsInPlay(balances)).toBe(7000);
    expect(totalFinalChips(balances)).toBe(7000);
    expect(settlementMismatch(balances)).toBe(0);

    const a = balances.find((b) => b.playerId === "A")!;
    const b = balances.find((b) => b.playerId === "B")!;
    const c = balances.find((b) => b.playerId === "C")!;
    // A: invirtió 20, vendió 1000 fichas por 10 => neto 10; fichas finales 0 => 0/100 - 10 = -10
    expect(a.netMoneyIn).toBe(10);
    expect(a.balance).toBe(-10);
    // B: invirtió 20 + 10 = 30; 4000/100 - 30 = 10
    expect(b.balance).toBe(10);
    // C: invirtió 30; 3000/100 - 30 = 0
    expect(c.balance).toBe(0);

    const pays = computeSettlements(
      balances.map((x) => ({ playerId: x.playerId, balance: x.balance })),
    );
    expect(pays).toEqual([{ from: "A", to: "B", amount: 10 }]);
  });
});
