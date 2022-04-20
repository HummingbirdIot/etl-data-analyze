#!/bin/bash
sqlite3 ./location.db << EOF
.headers on
.mode csv
CREATE TABLE IF NOT EXISTS sichuan(Location INTEGER, Long_State TEXT not null, Short_State TEXT not null); 
CREATE UNIQUE INDEX IF NOT EXISTS locationI on sichuan(Location);
.import sichuan.csv sichuan
EOF
