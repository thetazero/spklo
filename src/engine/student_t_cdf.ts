// Student-t CDF using an incomplete beta function approximation
export function studentTCdf(x: number, nu: number): number {
    const t = nu / (x * x + nu);
    const ib = betainc(t, nu / 2, 0.5);
    return x >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

// Regularized incomplete beta function
function betainc(x: number, a: number, b: number): number {
    const bt =
        (x === 0 || x === 1)
            ? 0
            : Math.exp(
                lgamma(a + b) - lgamma(a) - lgamma(b) +
                a * Math.log(x) + b * Math.log(1 - x)
            );

    if (x < (a + 1) / (a + b + 2)) {
        return bt * betacf(x, a, b) / a;
    } else {
        return 1 - bt * betacf(1 - x, b, a) / b;
    }
}

// Continued fraction for incomplete beta
function betacf(x: number, a: number, b: number): number {
    let m2, aa, c, d, del, h;
    const MAXIT = 100;
    const EPS = 3e-7;

    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    c = 1;
    d = 1 - (qab * x) / qap;
    if (Math.abs(d) < EPS) d = EPS;
    d = 1 / d;
    h = d;
    for (let m = 1; m <= MAXIT; m++) {
        m2 = 2 * m;
        aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < EPS) d = EPS;
        c = 1 + aa / c;
        if (Math.abs(c) < EPS) c = EPS;
        d = 1 / d;
        h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < EPS) d = EPS;
        c = 1 + aa / c;
        if (Math.abs(c) < EPS) c = EPS;
        d = 1 / d;
        del = d * c;
        h *= del;
        if (Math.abs(del - 1) < EPS) break;
    }
    return h;
}

// Log-gamma function
function lgamma(z: number): number {
    const g = 7;
    const p = [
        0.99999999999980993, 676.5203681218851,
        -1259.1392167224028, 771.32342877765313,
        -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6,
        1.5056327351493116e-7
    ];
    let x = p[0];
    for (let i = 1; i < p.length; i++) {
        x += p[i] / (z + i);
    }
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x) - Math.log(z);
}
