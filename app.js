const express = require("express");
const app = express();

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());

let dataBase = null;

const initializeServerAndDB = async function () {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB ERROR : ${e.message}`);
    process.exit(1);
  }
  app.listen(3000, function () {
    console.log("The server is running");
  });
};
initializeServerAndDB();

function convertPlayer(obj) {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
}

//1 get all players

app.get("/players/", async function (request, response) {
  const playersQuery = `
    SELECT * FROM player_details;
    `;
  const playersList = await dataBase.all(playersQuery);
  response.send(playersList.map(convertPlayer));
});

//2 get specific player

app.get("/players/:playerId/", async function (request, response) {
  const { playerId } = request.params;
  const playerQuery = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId};
    `;
  const player = await dataBase.get(playerQuery);
  response.send(convertPlayer(player));
});

// 3 update player

app.put("/players/:playerId/", async function (request, response) {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const playerUpdateQuery = `
    UPDATE player_details
    SET player_name = '${playerName}';
    `;
  await dataBase.run(playerUpdateQuery);
  response.send("Player Details Updated");
});

function convertMatch(obj) {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
}

//4 get match details

app.get("/matches/:matchId/", async function (request, response) {
  const { matchId } = request.params;
  const matchQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};
    `;
  const match = await dataBase.get(matchQuery);
  response.send(convertMatch(match));
});

//5 match details of player

app.get("/players/:playerId/matches/", async function (request, response) {
  const { playerId } = request.params;
  const playerMatchQuery = `
    SELECT match_details.match_id AS matchId,
    match, year FROM 
    player_match_score inner join match_details ON 
    player_match_score.match_id = match_details.match_id
    WHERE player_id = ${playerId};
    `;
  const playerMatch = await dataBase.all(playerMatchQuery);
  response.send(playerMatch);
});

//6 players in match

app.get("/matches/:matchId/players", async function (request, response) {
  const { matchId } = request.params;
  const matchPlayersQuery = `
    SELECT * FROM 
    player_match_score
      NATURAL JOIN player_details
    WHERE
    match_id = ${matchId};
    `;
  const matchPlayers = await dataBase.all(matchPlayersQuery);
  response.send(matchPlayers.map(convertPlayer));
});

//7 player Scores

app.get("/players/:playerId/playerScores/", async function (request, response) {
  const { playerId } = request.params;
  const playerScoresQuery = `
    SELECT player_details.player_id as playerId,
    player_name as playerName,
    sum(score) as totalScore,
    sum(fours) as totalFours,
    sum(sixes) as totalSixes FROM 
    player_match_score inner join player_details on player_details.player_id = 
    player_match_score.player_id
    WHERE player_details.player_id = ${playerId}
    `;
  const playerScores = await dataBase.get(playerScoresQuery);
  response.send(playerScores);
});

module.exports = app;
