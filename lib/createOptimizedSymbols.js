import fs from 'fs-extra';
import path from 'path';
import Svgo from 'svgo';
import sortBy from 'lodash/sortBy';
import cheerio from 'cheerio';

const svgo = new Svgo();

svgo.config.js2svg = svgo.config.js2svg || {};
svgo.config.js2svg.indent = 2;
svgo.config.js2svg.pretty = true;
svgo.config.plugins.forEach((plugins) => {
  plugins.forEach((plugin) => {
    if (plugin.name === 'cleanupIDs') Object.assign(plugin, { active: false });
  });
});

export default async (id, dir) => {
  let symbols = [];
  for (const file of await fs.readdir(dir)) {
    if (!/\.svg$/.test(file)) continue;
    const $ = cheerio.load(await fs.readFile(path.join(dir, file)));
    const viewBox = $('svg').attr('viewBox');
    const content = $('svg').html();
    symbols.push({ name: file.replace(/\.svg$/, ''), viewBox, content });
  }
  symbols = sortBy(symbols, ['name']);
  const svg = [
    `<svg id="${id}"><defs>`,
    ...symbols.map(({ name, viewBox, content }) =>
      [`<symbol id="${name}" viewBox="${viewBox}">`, content, '</symbol>'].join('\n'),
    ),
    '</defs></svg>',
  ].join('\n');
  return {
    svg: (await svgo.optimize(svg)).data,
    types: symbols.map(({ name }) => name),
  };
};
