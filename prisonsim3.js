/*  Objects:
      Hist
      Players
      Strat
      Rules
      Rulechanger?
    Flow:
      Read rules: Rules
      Create Scene: Hist Strat Players
      Compete: Players
      Recreate Scene: Rulechanger? Hist Strat Players
      Iterate
      Check for stabilization: Rules Players
      Display metrics
    Functions
      Start Step Reset?
      Print state?
      Compete
      Array checker
      Remove/Replace
      */

      

//Event format: [mem, token, round, comp, tourn]
// mem: enemy cooperated last turn, mem=1, enemy betrayed last turn, mem=0
// token: player has X tokens
// round: 2 players play X rounds in a competition
// comp: in a group of X players, players play X-1 competitions playing $round rounds each 
// tourn: number of tournaments survived, a tourn is a complete cycle of comps 



//Building basic objects; histories, strategies, players, changeable rules and strategies at top
let stratList = {
  0: {0:1, 1: `Copycat`, 2: function(event) {if (event[0]) {return 1} else { return 0}}, 3:0},
  1: {0:0, 1: `Cheater`, 2: function(){return 0}, 3:1},
  2: {0:1, 1: `FMO`, 2: function(event, flag) {if (!event[0]) {flag=1}; if (flag) {return 0} else {return 1}}, 3:2},
  3: {0:Math.round(Math.random()), 1:`Random`, 2: function() {return Math.round(Math.random())}, 3:3}
}

  function protoRules () {
  this.payoffs= [2,3,-1,0];
  this.rounds = 10;
  this.tourns = 1;
  this.playerCount = 25;
  this.elims=  5;
  this.miscom= 0;
  this.stratRatios= [1, 0, 0, 0]
};

function protoHist () {
  this.switchCount = 0; this.coopCount = 0; this.betrayCount = 0; this.tokenCount = 0;  this.roundCount = 0; this.compCount = 0; this.tournCount = 0; this.events= [[1,0,0,0,0]];
};

function protoStrat () {
  this.firstMove= 1; // 1 for coop, 0 for betray
  this.nextMove = 1;
  this.flag = 0;
  this.name= 'unnamed';
  this.stratID;
};
//convert different player types  to inherited objects at some point
function protoPlayer (strat, hist, num) {
  this.strat = new protoStrat(); 
  this.hist = new protoHist();
  this.name = `Player${num}`;
};


// main and helper functions follow
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function main() {
  // Read Rules and strats
  let rules = new protoRules();
  //Create Players
  countPlayers = 0;
  let players = [];
  for (x=0; x<rules.playerCount; x++) {
    players.push( new protoPlayer(new protoStrat, new protoHist, x));
    countPlayers++;
  };
  // Load strats
  stratWeight = [];
  for (x in rules.stratRatios) {stratWeight.push(Math.round(rules.playerCount*rules.stratRatios[x]))};
  playerCounter = 0;
  for (x in stratWeight) {
    console.log(playerCounter);
    while (stratWeight[x]>0){
      players[playerCounter].strat.findNext = stratList[x][2];
      players[playerCounter].strat.firstMove = stratList[x][0];
      players[playerCounter].strat.nextMove = stratList[x][0];
      players[playerCounter].strat.name = stratList[x][1];
      players[playerCounter].strat.stratID = stratList[x][3];
      //players[playerCounter].name = stratList[x][1];
      stratWeight[x]--;
      playerCounter++;
    };
  };
  //Iterate:
    // Run Tournament
        for (t=0; t<rules.tourns; t++){
        //Run all competitions 
          for (let i=0; i < players.length; i++) {
            for (let j=i+1; j < players.length; j++) {
              //Run all rounds
              for (let x = 0; x < rules.rounds; x++) {
                compete(players[i], players[j], rules.payoffs);
              };
              //reset strategy after round
              //console.log(i,j, players[0].hist.events[players[i].hist.events.length-1]);
              players[i].strat.nextMove=players[i].strat.firstMove;
              players[j].strat.nextMove=players[j].strat.firstMove;
            };
          };
          //console.log(players.length);
          playerCounter = replacer(players, rules.elims, playerCounter);
        };
    // Output Intermediate Values

    //Recreate Scene

    // Check for Stabilization

    for (x in players) {console.log(players[x].hist.events[players[x].hist.events.length-1])};
  //console.log(players[0].hist.events[players[0].hist.events.length-1], playerCounter)
};

//helper functions
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//replaces losing players with winning players
function replacer(players, elims, playerCounter) {
  killList = findExtreme(players, elims, `min`); // returns a matrix of [[position in players, min], ...]
  saveList = findExtreme(players, elims, `max`);
  //console.log(saveList, `save`);
  //console.log(killList, 'kill');
  //console.log(players.length, players[players.length-1]);
  for (x in killList) { 
    stratID = players[parseInt(saveList[x][0])].strat.stratID;
    players.push(new protoPlayer(new protoStrat, new protoHist, playerCounter));
    players[players.length-1].strat.findNext = stratList[stratID][2];
    players[players.length-1].strat.firstMove = stratList[stratID][0];
    players[players.length-1].strat.nextMove = stratList[stratID][0];
    players[players.length-1].strat.name = stratList[stratID][1];
    players[players.length-1].strat.stratID = stratList[stratID][3];
    players.splice([killList[x][0]], 1);
    //playerCounter++;
  }
  //console.log(players.length, players[players.length-1]);
  return playerCounter;
};

//finds best or worst players and returns their place in players[] and token count
function findExtreme(players, select, flag) {
  tokenEnds =[];
  for (x in players) {tokenEnds.push([x, players[x].hist.events[players[x].hist.events.length-1][4]]);};
  console.log(tokenEnds);
  if (flag == `min`){ tokenEnds.sort(function(a, b){return a[1]-b[1]})}
  else  {tokenEnds.sort(function(a, b){return b[1]-a[1]});}
  tokenEnds = tokenEnds.splice(0, tokenEnds.length-select); 
  tokenEnds.sort(function(a,b){return b[0]-a[0]});  
  return tokenEnds;
};

//checks if arrays contain the same values
function arrayEquals(array1, array2) {
  let flag = true;
  for (x in array1) {
    if (typeof array1[x] != "object")
      if (array1[x] != array2[x]) {flag = false; break;}
      else {arrayEquals(array1[x], array2[x])};
  };  
  return flag;
};


//runs prisoner's dillemma for two players, pays them tokens and records the event in player histories
function compete(player1, player2, payoffs) {
  choices = [player1.strat.nextMove, player2.strat.nextMove];
  let last1 = player1.hist.events[player1.hist.roundCount][0];
  let last2 = player2.hist.events[player2.hist.roundCount][0];
  player1.hist.roundCount ++; player2.hist.roundCount++;
  if (arrayEquals(choices, [1,1])) { // both coop
    //change history- token, coop, switch counts
    player1.hist.tokenCount += payoffs[0]; player2.hist.tokenCount += payoffs[0];
    player1.hist.coopCount += 1; player2.hist.coopCount +=1;
    if (last1 != 1) { player1.hist.switchCount += 1}; if (last2 != 1) { player2.hist.switchCount += 1}; 
    //build events in format of [mem, round, comp, tourn, token]
    player1.hist.events.push([1, player1.hist.roundCount, player1.hist.compCount, player1.hist.tournCount, player1.hist.tokenCount]);
    player2.hist.events.push([1, player2.hist.roundCount, player2.hist.compCount, player2.hist.tournCount, player2.hist.tokenCount]);
  } 
  else if (arrayEquals(choices, [1,0])) { // 1 coops, 2 betrays
    //change history- token, coop, betray, switch counts
    player1.hist.tokenCount += payoffs[2]; player2.hist.tokenCount += payoffs[1];
    player1.hist.coopCount += 1; player2.hist.betrayCount +=1;
    if (last1 != 1) { player1.hist.switchCount += 1}; if (last2 != 0) { player2.hist.switchCount += 1}; 
    //build events in format of [mem, round, comp, tourn, token]
    player1.hist.events.push([1, player1.hist.roundCount, player1.hist.compCount, player1.hist.tournCount, player1.hist.tokenCount]);
    player2.hist.events.push([0, player2.hist.roundCount, player2.hist.compCount, player2.hist.tournCount, player2.hist.tokenCount]);
  }
  else if (arrayEquals(choices, [0,1])) { // 1 betrays, 2 coops
    //change history- token, coop, betray, switch counts
    player1.hist.tokenCount += payoffs[1]; player2.hist.tokenCount += payoffs[2];
    player1.hist.betrayCount += 1; player2.hist.coopCount +=1;
    if (last1 != 0) { player1.hist.switchCount += 1}; if (last2 != 1) { player2.hist.switchCount += 1}; 
    //build events in format of [mem, round, comp, tourn, token]
    player1.hist.events.push([0, player1.hist.roundCount, player1.hist.compCount, player1.hist.tournCount, player1.hist.tokenCount]);
    player2.hist.events.push([1, player2.hist.roundCount, player2.hist.compCount, player2.hist.tournCount, player2.hist.tokenCount]);
  }
  else {// both betray
    //change history- token, betray, switch counts
    player1.hist.tokenCount += payoffs[2]; player2.hist.tokenCount += payoffs[1];
    player1.hist.betrayCount += 1; player2.hist.betrayCount +=1;
    if (last1 != 0) { player1.hist.switchCount += 1}; if (last2 != 0) { player2.hist.switchCount += 1}; 
    //build events in format of [mem, round, comp, tourn, token]
    player1.hist.events.push([0, player1.hist.roundCount, player1.hist.compCount, player1.hist.tournCount, player1.hist.tokenCount]);
    player2.hist.events.push([0, player2.hist.roundCount, player2.hist.compCount, player2.hist.tournCount, player2.hist.tokenCount]);
  };
  // calculate next moves
  player1.strat.nextMove = player1.strat.findNext(player1.hist.events[player1.hist.events.length-1]);  player2.strat.nextMove = player2.strat.findNext(player2.hist.events[player2.hist.events.length-1]);
};


main();