/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const Benchmark = require('benchmark');

const { styleq } = require('../dist/styleq');
const { localizeStyle } = require('../dist/transform-localize-style');

/**
 * Test helpers
 */

const suite = new Benchmark.Suite('styleq-benchmarks');
const test = (...args) => suite.add(...args);

function jsonReporter(suite) {
  const benchmarks = [];
  const config = {
    folder: 'logs',
    callback(results, name, folder) {
      // Write the results log
      const dirpath = `${process.cwd()}/${folder}`;
      const filepath = `${dirpath}/${name}.log`;
      if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath);
      }
      fs.writeFileSync(filepath, `${JSON.stringify(results, null, 2)}\n`);

      // Print the markdown table
      let markdown = '';
      markdown += `| Benchmark | ops/sec | deviation (%) | samples |\n`;
      markdown += `| :---      |    ---: |          ---: |    ---: |\n`;
      markdown += results
        .map((data) => {
          const { name, deviation, ops, samples } = data;
          const prettyOps = parseInt(ops, 10).toLocaleString();
          return `| ${name} | ${prettyOps} | ${deviation} | ${samples} |`;
        })
        .join('\n');
      console.log(markdown);
    },
  };

  suite.on('cycle', (event) => {
    benchmarks.push(event.target);
  });

  suite.on('error', (event) => {
    throw new Error(String(event.target.error));
  });

  suite.on('complete', () => {
    const timestamp = Date.now();
    const result = benchmarks.map((bench) => {
      if (bench.error) {
        return {
          name: bench.name,
          id: bench.id,
          error: bench.error,
        };
      }

      return {
        name: bench.name,
        id: bench.id,
        samples: bench.stats.sample.length,
        deviation: bench.stats.rme.toFixed(2),
        ops: bench.hz.toFixed(bench.hz < 100 ? 2 : 0),
        timestamp,
      };
    });
    config.callback(result, suite.name, config.folder);
  });
}

jsonReporter(suite);

/**
 * Additional test subjects
 */

const styleqNoCache = styleq.factory({ disableCache: true });
const styleqWithLocalization = styleq.factory({
  transform(style) {
    return localizeStyle(style, false);
  },
});

/**
 * Fixtures
 */

const basicStyleFixture1 = {
  $$css: true,
  backgroundColor: 'backgroundColor-1',
  color: 'color-1',
};

const basicStyleFixture2 = {
  $$css: true,
  backgroundColor: 'backgroundColor-2',
  color: 'color-2',
};

const bigStyleFixture = {
  $$css: true,
  backgroundColor: 'backgroundColor-3',
  borderColor: 'borderColor-3',
  borderStyle: 'borderStyle-3',
  borderWidth: 'borderWidth-3',
  boxSizing: 'boxSizing-3',
  display: 'display-3',
  listStyle: 'listStyle-3',
  marginTop: 'marginTop-3',
  marginEnd: 'marginEnd-3',
  marginBottom: 'marginBottom-3',
  marginStart: 'marginStart-3',
  paddingTop: 'paddingTop-3',
  paddingEnd: 'paddingEnd-3',
  paddingBottom: 'paddingBottom-3',
  paddingStart: 'paddingStart-3',
  textAlign: 'textAlign-3',
  textDecoration: 'textDecoration-3',
  whiteSpace: 'whiteSpace-3',
  wordWrap: 'wordWrap-3',
  zIndex: 'zIndex-3',
};

const bigStyleWithPseudosFixture = {
  $$css: true,
  backgroundColor: 'backgroundColor-4',
  border: 'border-4',
  color: 'color-4',
  cursor: 'cursor-4',
  display: 'display-4',
  fontFamily: 'fontFamily-4',
  fontSize: 'fontSize-4',
  lineHeight: 'lineHeight-4',
  marginEnd: 'marginEnd-4',
  marginStart: 'marginStart-4',
  paddingEnd: 'paddingEnd-4',
  paddingStart: 'paddingStart-4',
  textAlign: 'textAlign-4',
  textDecoration: 'textDecoration-4',
  ':focus$color': 'focus$color-4',
  ':focus$textDecoration': 'focus$textDecoration-4',
  ':active$transform': 'active$transform-4',
  ':active$transition': 'active$transition-4',
};

const complexNestedStyleFixture = [
  bigStyleFixture,
  false,
  false,
  false,
  false,
  [
    {
      $$css: true,
      cursor: 'cursor-a',
      touchAction: 'touchAction-a',
    },
    false,
    {
      $$css: true,
      outline: 'outline-b',
    },
    [
      {
        $$css: true,
        cursor: 'cursor-c',
        touchAction: 'touchAction-c',
      },
      false,
      false,
      {
        $$css: true,
        textDecoration: 'textDecoration-d',
        ':focus$textDecoration': 'focus$textDecoration-d',
      },
      false,
      [
        bigStyleWithPseudosFixture,
        {
          $$css: true,
          display: 'display-e',
          width: 'width-e',
        },
        [
          {
            $$css: true,
            ':active$transform': 'active$transform-f',
          },
        ],
      ],
    ],
  ],
];

// SMALL OBJECT

test('small object', () => {
  styleq(basicStyleFixture1);
});

test('small object (cache miss)', () => {
  styleq({ ...basicStyleFixture1 });
});

test('small object (cache disabled)', () => {
  styleqNoCache({ ...basicStyleFixture1 });
});

// LARGE OBJECT

test('large object', () => {
  styleq(bigStyleFixture);
});

test('large object (cache miss)', () => {
  styleq({ ...bigStyleFixture });
});

test('large object (cache disabled)', () => {
  styleqNoCache({ ...bigStyleFixture });
});

// SMALL MERGE

test('small merge', () => {
  styleq(basicStyleFixture1, basicStyleFixture2);
});

test('small merge (cache miss)', () => {
  styleq({ ...basicStyleFixture1 }, { ...basicStyleFixture2 });
});

test('small merge (cache disabled)', () => {
  styleqNoCache(basicStyleFixture1, basicStyleFixture2);
});

// LARGE MERGE

test('large merge', () => {
  styleq([complexNestedStyleFixture]);
});

test('large merge (cache disabled)', () => {
  styleqNoCache([complexNestedStyleFixture]);
});

// INLINE STYLES

test('small inline style', () => {
  styleq({ backgroundColor: 'red' });
});

test('large inline style', () => {
  styleq({
    backgroundColor: 'red',
    borderColor: 'red',
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-bx',
    display: 'flex',
    listStyle: 'none',
    marginTop: '0',
    marginEnd: '0',
    marginBottom: '0',
    marginStart: '0',
    paddingTop: '0',
    paddingEnd: '0',
    paddingBottom: '0',
    paddingStart: '0',
    textAlign: 'start',
    textDecoration: 'none',
    whiteSpace: 'pre',
    zIndex: '0',
  });
});

test('merged inline style', () => {
  styleq(
    {
      backgroundColor: 'blue',
      borderColor: 'blue',
      display: 'block',
    },
    {
      backgroundColor: 'red',
      borderColor: 'red',
      borderStyle: 'solid',
      borderWidth: '1px',
      boxSizing: 'border-bx',
      display: 'flex',
      listStyle: 'none',
      marginTop: '0',
      marginEnd: '0',
      marginBottom: '0',
      marginStart: '0',
      paddingTop: '0',
      paddingEnd: '0',
      paddingBottom: '0',
      paddingStart: '0',
      textAlign: 'start',
      textDecoration: 'none',
      whiteSpace: 'pre',
      zIndex: '0',
    }
  );
});

// LOCALIZE

const styleNeedsLocalizationFixture = {
  $$css: true,
  $$css$localize: true,
  backgroundColor: 'backgroundColor-class',
  borderColor: 'borderColor-class',
  borderStyle: 'borderStyle-class',
  borderWidth: 'borderWidth-class',
  boxSizing: 'boxSizing-class',
  display: 'display-class',
  listStyle: 'listStyle-class',
  marginTop: 'marginTop-class',
  marginEnd: ['marginRight-class', 'marginLeft-class'],
  marginBottom: 'marginBottom-class',
  marginStart: ['marginLeft-class', 'marginRight-class'],
  paddingTop: 'paddingTop-class',
  paddingEnd: ['paddingRight-class', 'paddingLeft-class'],
  paddingBottom: 'paddingBottom-class',
  paddingStart: ['paddingLeft-class', 'paddingRight-class'],
  textAlign: 'textAlign-class',
  textDecoration: 'textDecoration-class',
  whiteSpace: 'whiteSpace-class',
  wordWrap: 'wordWrap-class',
  zIndex: 'zIndex-class',
};

test('transform: localize-style', () => {
  styleqWithLocalization(styleNeedsLocalizationFixture);
});

suite.run();
