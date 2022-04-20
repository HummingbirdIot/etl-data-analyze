import * as fs from 'fs';
import Database from 'better-sqlite3';
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
    path: './sichuan_maker_count.csv',
    header: [
        {id: 'Name', title: 'Vendor'},
        {id: 'Count', title: 'CountInSichuan'},
        {id: 'Amount', title: 'Amount'},
        {id: 'Proportion', title: 'Proportion %'}
    ]
});

const makerTable = {};
const makerInfo = JSON.parse(fs.readFileSync('./maker.json').toString().trim());


function dumpMakerTable(table) {
  let output = Object.values(table).map((data:any) => {
    return {
        Name: data.Name,
        Count: data.Count,
        Amount: data.Amount,
        Proportion: (parseInt(data.Count) * 100 /parseInt(data.Amount)).toFixed(4),
    }
  });
  csvWriter.writeRecords(output).then(() => {
    console.log('done')
  });
}
makerInfo.forEach((data) => {
  const db = new Database('hotspots.db', {readonly:true});
  let info = db.prepare('SELECT count(*) as count FROM gw WHERE payer = ?').get(data.Address);
  makerTable[data.Address] = {
    Name: data.Name,
    Count: 0,
    Amount: parseInt(info.count),
  }
  db.close();
});

const siChuanLocaiton = {};
function loadSichuanLocation() {
  const db = new Database('location.db', {readonly:true});
  const info = db.prepare('SELECT Location from sichuan').all();
  //console.log(info);
  info.forEach((data:any) => {
    siChuanLocaiton[data.Location] = true;
  });
}

function getGwInSichuan() {
  const db = new Database('hotspots.db', {readonly:true});
  let info = db.prepare('SELECT * FROM gw').all();
  info.forEach((data:any) => {
    //console.log(data.Location);

    if (!data.Payer) {
      return;
    }
    if (siChuanLocaiton[data.Location]) {
      let makerData = makerTable[data.Payer];
      if (!makerData) {
        console.log(data);
      } else {
        makerTable[data.Payer].Count += 1;
      }
    }
  });

}
loadSichuanLocation();
//console.log(makerTable);
//console.log(siChuanLocaiton);
getGwInSichuan();
dumpMakerTable(makerTable);
