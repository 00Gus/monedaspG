function simulate() {
  const numCoins = parseInt(document.getElementById('numCoins').value);
  const results = [];
  const coinContainer = document.getElementById('coinContainer');
  coinContainer.innerHTML = '';

  let headsCount = 0;

  for (let i = 0; i < numCoins; i++) {
    const isHead = Math.random() < 0.5;
    results.push(isHead ? 1 : 0);
    headsCount += isHead ? 1 : 0;

    const coin = document.createElement('div');
    coin.classList.add('coin');
    coin.textContent = isHead ? '🪙' : '❌';
    coinContainer.appendChild(coin);
  }

  const probabilities = [];
  const labels = [];

  for (let k = 0; k <= numCoins; k++) {
    const prob = binomialProbability(numCoins, k, 0.5);
    probabilities.push(prob);
    labels.push(`${k} caras`);
  }

  drawHistogram(labels, probabilities, headsCount);
  generateTable(numCoins);
}

function binomialCoefficient(n, k) {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let coeff = 1;
  for (let i = 1; i <= k; i++) {
    coeff *= (n - i + 1) / i;
  }
  return coeff;
}

function binomialProbability(n, k, p) {
  return binomialCoefficient(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

let chart, multiChart;

function drawHistogram(labels, data, highlightIndex) {
  const backgroundColors = data.map((_, i) =>
    i === highlightIndex ? 'rgba(255, 99, 132, 0.8)' : 'rgba(54, 162, 235, 0.6)'
  );

  if (chart) chart.destroy();

  const ctx = document.getElementById('histogram').getContext('2d');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Probabilidad teórica',
        data,
        backgroundColor: backgroundColors,
        borderColor: 'white',
        borderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Distribución Binomial de Caras',
          color: 'white',
          font: { size: 18 }
        },
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: 'white' } },
        x: { ticks: { color: 'white' } }
      }
    }
  });
}

function generateTable(n) {
  const tableBody = document.querySelector("#comboTable tbody");
  tableBody.innerHTML = '';

  let maxProb = 0;
  let mostLikely = 0;

  for (let k = 0; k <= n; k++) {
    const comb = binomialCoefficient(n, k);
    const prob = binomialProbability(n, k, 0.5);
    if (prob > maxProb) {
      maxProb = prob;
      mostLikely = k;
    }

    const row = document.createElement('tr');

    const td1 = document.createElement('td');
    td1.textContent = k;

    const td2 = document.createElement('td');
    td2.textContent = comb;

    const td3 = document.createElement('td');
    td3.textContent = (prob * 100).toFixed(2) + '%';

    const td4 = document.createElement('td');
    const bar = document.createElement('div');
    bar.classList.add('progress-bar');
    bar.style.width = (prob * 100) + '%';
    td4.appendChild(bar);

    row.appendChild(td1);
    row.appendChild(td2);
    row.appendChild(td3);
    row.appendChild(td4);
    tableBody.appendChild(row);
  }

  const infoBox = document.getElementById('mostLikely');
  infoBox.textContent = `🎯 Combinación más probable: ${mostLikely} caras (${(maxProb * 100).toFixed(2)}% de probabilidad)`;
}

function simulateMultiple() {
  const numCoins = parseInt(document.getElementById('numCoins').value);
  const numExperiments = parseInt(document.getElementById('numExperiments').value);
  const frequency = Array(numCoins + 1).fill(0);

  for (let i = 0; i < numExperiments; i++) {
    let heads = 0;
    for (let j = 0; j < numCoins; j++) {
      if (Math.random() < 0.5) heads++;
    }
    frequency[heads]++;
  }

  const labels = Array.from({ length: numCoins + 1 }, (_, i) => `${i} caras`);
  const empirical = frequency.map(count => count / numExperiments);

  if (multiChart) multiChart.destroy();

  const ctx = document.getElementById('multiHistogram').getContext('2d');
  multiChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Frecuencia empírica',
          data: empirical,
          backgroundColor: 'rgba(255, 206, 86, 0.7)',
          borderColor: '#fff',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Frecuencia de combinaciones en ${numExperiments} experimentos`,
          color: 'white',
          font: { size: 18 }
        },
        legend: {
          labels: { color: 'white' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: 'white' }
        },
        x: {
          ticks: { color: 'white' }
        }
      }
    }
  });
}
