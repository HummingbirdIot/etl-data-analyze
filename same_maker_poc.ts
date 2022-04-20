//1210000-1216319
//1312123-1317000
import * as fs from 'fs';
import Database from 'better-sqlite3';
const CsvReadableStream = require('csv-reader');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
    path: './same-maker-witnesses.csv',
    header: [
        {id: 'Name', title: 'Vendor'},
        {id: 'SameMakerWitenessesCount', title: 'Same-Maker-witnesses'},
        {id: 'WitnessesAmount', title: 'witnesses-WitnessesAmount'},
        {id: 'Proportion', title: 'Proportion %'}
    ]
});

const makerTable = {};
const makerInfo = JSON.parse(fs.readFileSync('./maker.json').toString().trim());
const db = new Database('hotspots.db', {readonly:true});

let inputStream = fs.createReadStream('poc.csv', 'utf8');

makerInfo.forEach((data) => {
  let info = db.prepare('SELECT count(*) as count FROM gw WHERE payer = ?').get(data.Address);
  makerTable[data.Address] = {
    Name: data.Name,
    SameMakerWitenessesCount: 0,
    WitnessesAmount: 0,
    Proportion: 0,
  }
});

let checkedNum = 0;
let skipedNum = 0;
function checkSameMaker(gws: Array<string>) {
  //console.log('gws:', gws);
  checkedNum++;
  let makers:Set<string> = new Set();
  gws.forEach((gw) => {
    let info = db.prepare('SELECT Payer FROM gw WHERE Address = ?').get(gw);
    if (!info) {
      console.log('failed to get maker for:', gw);
    } else {
      if (!info.Payer) {
        console.log('payer is undefine gw is', gw);
      } else {
        makers.add(info.Payer);
      }
    }
  });

  for (let maker of makers) {
    let data = makerTable[maker];
    if (data) {
      data.WitnessesAmount += 1;
    } else {
      console.log('missed maker:', maker, 'makers:', makers);
    }
  }

  if (makers.size === 1) {
    for (let maker of makers) {
      let data = makerTable[maker];
      if (data) {
        data.SameMakerWitenessesCount += 1;
      } else {
        console.log('missed maker for same-maker-witnesses:', maker);
      }
    }
  }
}

function dumpMakerTable(table) {
  let output = Object.values(table).map((data:any) => {
    return {
        Name: data.Name,
        SameMakerWitenessesCount: data.SameMakerWitenessesCount,
        WitnessesAmount: data.WitnessesAmount,
        Proportion: data.WitnessesAmount === 0 ? 0 : (parseInt(data.SameMakerWitenessesCount) * 100 /parseInt(data.WitnessesAmount)).toFixed(4),
    }
  });
  csvWriter.writeRecords(output).then(() => {
    console.log(output)
  });
}

inputStream.
  pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true , asObject: true}))
.on('data', function (row) {
  let data = JSON.parse(row.Path);
  if (data.length != 1) {
    process.exit(0);
  }
  data = data[0];
  if (!data.receipt) {
    //console.log('invalid receipt');
  } else {
    let gws = data.witnesses.map((data) => {
      return data.gateway;
    });
    gws.push(data.receipt.gateway);
    if (gws.length < 2) {
      return;
    }
    checkSameMaker(gws);
  }
})
.on('end', function () {
  dumpMakerTable(makerTable);
  console.log('checkedNum: ', checkedNum);
});
