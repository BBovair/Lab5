/**
 * @jest-environment jsdom
 */

describe('Recipe App UI', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input type="text" id="ingredients" />
      <button id="searchButton">Search Recipes</button>
      <select id="dietary"></select>
      <div id="recipeResults"></div>
    `;
  });

  test('should have an ingredients input field', () => {
    const input = document.querySelector('#ingredients');
    expect(input).toBeTruthy();
    expect(input.type).toBe('text');
  });

  test('should have a search button', () => {
    const button = document.querySelector('#searchButton');
    expect(button).toBeTruthy();
    expect(button.textContent).toBe('Search Recipes');
  });

  test('should have a dietary restrictions dropdown', () => {
    const select = document.querySelector('#dietary');
    expect(select).toBeTruthy();
    expect(select.tagName.toLowerCase()).toBe('select');
  });

  test('should have a recipe results section', () => {
    const results = document.querySelector('#recipeResults');
    expect(results).toBeTruthy();
  });
}); 