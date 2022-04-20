#!/bin/bash
sqlite3 ./hotspots.db << EOF
.headers on
.mode csv
CREATE TABLE IF NOT EXISTS  gw(Address text not null,  Location  INTEGER not null, Payer not null); \
CREATE UNIQUE INDEX IF NOT EXISTS gwAI on gw(Address);
.import gw.csv gw
EOF
