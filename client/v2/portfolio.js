// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentSales = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals= document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const spanNbSales = document.querySelector('#nbSales');
const spanAverageSales = document.querySelector('#averageSales');
const spanP5Sales = document.querySelector('#p5Sales');
const spanP25Sales = document.querySelector('#p25Sales');
const spanP50Sales = document.querySelector('#p50Sales');
const spanLifetimeValue = document.querySelector('#lifetimeValue');
const buttonBestDiscount = document.querySelector('#filter-best-discount');
const buttonHotDeals = document.querySelector('#filter-hot-deals');
const buttonFavorite = document.querySelector('#filter-favorite');
const selectSort = document.querySelector('#sort-select');

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentDeals, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

/**
 * Fetch sales from api
 * @param  {String} id - lego set id
 * @return {Object}
 */
const fetchSales = async (id) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/sales?id=${id}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return [];
    }

    return body.data.result;
  } catch (error) {
    console.error(error);
    return [];
  }
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      const isFavorite = favorites.includes(deal.uuid);
      const favoriteBtn = isFavorite ? '❤️' : '🤍';
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <button class="favorite" data-uuid="${deal.uuid}">${favoriteBtn}</button>
        <a href="${deal.link}" target="_blank">${deal.title}</a>
        <span>${deal.price}</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render list of sales
 * @param  {Array} sales
 */
const renderSales = sales => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = sales
    .map(sale => {
      return `
      <div class="sale" id=${sale.uuid}>
        <span>${sale.title}</span>
        <a href="${sale.link}" target="_blank">${sale.price}</a>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Vinted Sales</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render sales indicators
 * @param  {Array} sales
 */
const renderSalesIndicators = (sales = []) => {
  spanNbSales.innerHTML = sales.length;

  const prices = sales.map(sale => parseFloat(sale.price)).sort((a, b) => a - b);

  if (prices.length === 0) {
    spanAverageSales.innerHTML = 0;
    spanP5Sales.innerHTML = 0;
    spanP25Sales.innerHTML = 0;
    spanP50Sales.innerHTML = 0;
    spanLifetimeValue.innerHTML = 0;
    return;
  }

  const average = prices.reduce((a, b) => a + b, 0) / prices.length;

  spanAverageSales.innerHTML = average.toFixed(2);
  spanP5Sales.innerHTML = prices[Math.ceil(prices.length * 0.05) - 1];
  spanP25Sales.innerHTML = prices[Math.ceil(prices.length * 0.25) - 1];
  spanP50Sales.innerHTML = prices[Math.ceil(prices.length * 0.50) - 1];

  const dates = sales.map(sale => new Date(sale.published)).sort((a, b) => a - b);
  spanLifetimeValue.innerHTML = `${Math.ceil((new Date() - dates[0]) / (1000 * 60 * 60 * 24))} days`;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids.map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals)
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

/**
 * Select the page to display
 */
selectPage.addEventListener('change', async (event) => {
  const deals = await fetchDeals(parseInt(event.target.value), parseInt(selectShow.value));

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

/**
 * Filter by best discount
 */
buttonBestDiscount.addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => deal.discount > 5);
  render(filteredDeals, currentPagination);
});

/**
 * Filter by hot deals
 */
buttonHotDeals.addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => deal.temperature > 100);
  render(filteredDeals, currentPagination);
});

/**
 * Display sales for a specific lego set id
 */
selectLegoSetIds.addEventListener('change', async (event) => {
  const sales = await fetchSales(event.target.value);
  currentSales = sales;
  renderSales(currentSales);
  renderSalesIndicators(currentSales);
});

/**
 * Save as favorite
 */
sectionDeals.addEventListener('click', (event) => {
  const target = event.target;
  if (target.classList.contains('favorite')) {
    const uuid = target.dataset.uuid;
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(uuid);

    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(uuid);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    render(currentDeals, currentPagination);
  }
});

/**
 * Filter by favorite
 */
buttonFavorite.addEventListener('click', () => {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const filteredDeals = currentDeals.filter(deal => favorites.includes(deal.uuid));
  render(filteredDeals, currentPagination);
});

/**
 * Sort by price
 */
selectSort.addEventListener('change', (event) => {
  const sort = event.target.value;

  if (sort === 'price-asc') {
    currentDeals.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    currentDeals.sort((a, b) => b.price - a.price);
  } else if (sort === 'date-asc') {
    currentDeals.sort((a, b) => a.published - b.published);
  } else if (sort === 'date-desc') {
    currentDeals.sort((a, b) => b.published - a.published);
  }

  render(currentDeals, currentPagination);
});

document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});
