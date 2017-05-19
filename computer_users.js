//generates a random move
function randomCoord() {
  while(true) {
    var r = Math.floor(Math.random()*numGrid);
    var c = Math.floor(Math.random()*numGrid);
    if(board[r][c].innerHTML == '') return new Coordinate(r,c);
  }
}

/*
First check if it's one step from winning (if yes, it wins)
Then check if it's one step from losing (if yes, it blocks the opponent)
Otherwise, make a random move.
*/
function AI1() 
{
  var coord = emergency_win();
  if(coord != false) return coord;
  else coord = emergency_lose();
  if(coord != false) return coord;
  return randomCoord();
}

/*
First detect any emergency (one step from win or lose). If there is one, make that move.
Next see if an opponent's move can create two emergencies simultaneously:
  If so, find a move (with recursion) that will prevent this situation.
  If don't see any threat, make a move according to rules as follow: 
    Find the spot(s) that is on the most number of all-blank horizontal/vertical/diagonal lines
    If there're multiple such moves, find the spot(s) that'll block most opponent's possible winning route(s)
    If there're still multiple moves, choose a random one.
*/
function AI6() 
{
  var alternate = getAlternateMove_v2();
  var priority = emergency_win();
  if(priority != false) {return priority;}
  else priority = emergency_lose();
  if(priority != false) {return priority;}
  else priority = potential_emergency_v3(1);
  if(priority != false) {return priority;}
  else {return alternate;}
}

/*
First half of AI1 core
If it's one step away from winning, it makes that move.
Judge based on class name not innerHTML, can be used for simulations
*/
function emergency_win()
{
  var Xhori=0; var Xvert=0;
  var Xdiag1=0; var Xdiag2=0;
  for(var i=0; i<numGrid; i++) 
  {
    //count diagonal Xs
    if(board[i][i].classList.contains(currentPlayer.letter)) Xdiag1++;
    if(board[i][numGrid-1-i].classList.contains(currentPlayer.letter)) Xdiag2++;
    //Last loop, should've counted all XOdiags. any diagonal almost-win?
    if(i==numGrid-1 && Xdiag1 == numGrid-1 && AIhelper('diag1') != false) 
      return AIhelper('diag1');
    else if(i==numGrid-1 && Xdiag2 == numGrid-1 && AIhelper('diag2') != false) 
      return AIhelper('diag2');

    //no? check for horizontals and verticals.
    else {
      for (var j=0; j<numGrid; j++) {
        //horizontal
        if(board[i][j].classList.contains(currentPlayer.letter)) Xhori++;
        //vertical
        if(board[j][i].classList.contains(currentPlayer.letter)) Xvert++;
        //Last inner loop. Check for vertical almost-win.
        if(j==numGrid-1 && Xvert == numGrid-1 && AIhelper('vert',i) != false)
          return AIhelper('vert',i);
      }
      //check for horizontal almost-win.
      if(Xhori == numGrid-1 && AIhelper('hori',i) != false)
        return AIhelper('hori',i);
      //reset horizontal and vertical count variables
      Xhori = 0; Xvert = 0;
    }
  }
  return false;
}

/*
Second half of AI1 core, also a helper for AI4 and onward
if it's one step away from losing, it blocks its opponent
Judge based on class name not innerHTML, can be used for simulated moves.
*/
function emergency_lose()
{
  var Ohori=0; var Overt=0;
  var Odiag1=0; var Odiag2=0;

  for(var i=0; i<numGrid; i++) 
  {
    //count diagonal Os
    if(board[i][i].classList.contains(currentPlayer.opponent.letter)) Odiag1++;
    if(board[i][numGrid-i-1].classList.contains(currentPlayer.opponent.letter)) Odiag2++;
    //Last loop, should've counted all XOdiags. any diagonal almost-win?
    if(i==numGrid-1 && Odiag1 == numGrid-1 && AIhelper('diag1') != false) 
      return AIhelper('diag1');
    else if(i==numGrid-1 && Odiag2 == numGrid-1 && AIhelper('diag2') != false) 
      return AIhelper('diag2');

    //no? check for horizontals and verticals.
    else {
      for (var j=0; j<numGrid; j++) {
        //horizontal
        if(board[i][j].classList.contains(currentPlayer.opponent.letter)) Ohori++;
        //vertical
        if(board[j][i].classList.contains(currentPlayer.opponent.letter)) Overt++;
        
        //Last inner loop. Check for vertical almost-win.
        if(j==numGrid-1 && Overt == numGrid-1 && AIhelper('vert',i) != false)
          return AIhelper('vert',i);
      }
      //check for horizontal almost-win.
      if(Ohori == numGrid-1 && AIhelper('hori',i) != false)
        return AIhelper('hori',i);
      //reset horizontal and vertical count variables
      Ohori = 0; Overt = 0;
    }
  }
  return false;
}

/*New in AI6. After detecting such a potential danger, 
recursively find the best move to make or realize that it's screwed anyway.
*/
function potential_emergency_v3(threshold)
{
  var result = false;
  for(var i=0; i<numGrid; i++)
  {
    for(var j=0; j<numGrid; j++)//access each grid
    {
      if(board[i][j].innerHTML == '')//look at only blank grids
      {
        result = potential_emergency_helper(new Coordinate(i,j),threshold);
        if(result != false) return result;
      }
    }
  }
  return result;
}

function potential_emergency_helper(coord,threshold)
{
  if (threshold < 0) return false;
  //simulate a step by the opponent to see what happens
  board[coord.r][coord.c].classList.add(currentPlayer.opponent.letter);
  var res1 = emergency_lose();
  if(res1 != false) //it will cause an emergency
  {
    //What if I then block that emergency?
    board[res1.r][res1.c].classList.add(currentPlayer.letter);
    var res2 = emergency_lose();
    //delete class name used for simulation
    board[res1.r][res1.c].classList.remove(currentPlayer.letter);
    if(res2 != false) //there's still an emergency, which means the first simulated move is a potential danger
    {
      //make all three branches clean from simulations first
      board[coord.r][coord.c].classList.remove(currentPlayer.opponent.letter);
      //take res1 and see if there's still potential emerg.
      board[res1.r][res1.c].classList.add(currentPlayer.letter);
      var res3 = potential_emergency_helper(coord,threshold-1);
      var res4 = potential_emergency_helper(res2,threshold-1);
      //console.log(res3);console.log(res4);
      board[res1.r][res1.c].classList.remove(currentPlayer.letter);
      if(res3==false && res4==false) return res1;
      //res1 is not safe, so try res2.
      board[res2.r][res2.c].classList.add(currentPlayer.letter);
      res3 = potential_emergency_helper(coord,threshold-1);
      res4 = potential_emergency_helper(res1,threshold-1);
      board[res2.r][res2.c].classList.remove(currentPlayer.letter);
      if(res3==false && res4==false) return res2;
      //res2 is not safe, try grid.
      board[coord.r][coord.c].classList.add(currentPlayer.letter);
      res3 = potential_emergency_helper(res2,threshold-1);
      res4 = potential_emergency_helper(res1,threshold-1);
      board[coord.r][coord.c].classList.remove(currentPlayer.letter);
      if(res3==false && res4==false) return coord;
      //all three are not safe,
      console.log('AI: I\'m screwed :/');
    }
  }
  board[coord.r][coord.c].classList.remove(currentPlayer.opponent.letter);
  return false;
}


//Update of getAlternateMove, new in AI3
function getAlternateMove_v2()
{
  updateMap_v2();
  var max = 0;//largest number in map
  var maxArray = new Array();//array of grids that has the largest number in map
  var newMax = 0;
  var newMaxArray = new Array();//array of coordinates. R contains a coordinate to be returned, c contains c in map2
  for(var i=0; i<numGrid; i++)
  {
    for(var j=0; j<numGrid; j++)//access each grid
    {
      if(board[i][j].innerHTML == '')//count only blank grids
      {
        if(map2[i][j].r > max) 
        {
          max = map2[i][j].r;
          maxArray = new Array();
          maxArray[maxArray.length] = new Coordinate(new Coordinate(i,j),map2[i][j].c);
        } else if(map2[i][j].r == max) 
          maxArray[maxArray.length] = new Coordinate(new Coordinate(i,j),map2[i][j].c);
      }
    }
  }
  if(maxArray.length == 0) {
    return randomCoord();
    console.log('calling randomCoord from getAlternateMove (shouldn\'t happen)');
  }
  newMax = 0;
  newMaxArray = new Array();
  for(var i=0; i<maxArray.length; i++)
  {
    if(maxArray[i].c > newMax)
    {
      newMax = maxArray[i].c;
      newMaxArray = new Array();
      newMaxArray[newMaxArray.length] = maxArray[i].r;
    } else if (maxArray[i].c == newMax) 
      newMaxArray[newMaxArray.length] = maxArray[i].r;
  }

  var rand = Math.floor(Math.random()*newMaxArray.length);
  return newMaxArray[rand];
}


//update of updateMap, new in AI3
function updateMap_v2() {
  for(var i=0; i<numGrid; i++)
  {
    //r contains #blanks it is on, c contains #only-opponent routes it is on.
    for(var j=0; j<numGrid; j++) map2[i][j] = new Coordinate(0,0);
  }

  for(var i=0; i<numGrid; i++)//each row
  {
    for(var j=0; j<numGrid; j++)//each grid
    {
      if(board[i][j].innerHTML == '')//each blank grid
      {
        var h = 0; var v = 0; //#blanks on the same row/column with this
        var ho = false; var vo = false;//whether there's opponent on the same row/column
        var hx = false; var vx = false;//whether it's already safe
        for(var k=0; k<numGrid; k++)//h and v
        {
          if(board[k][j].innerHTML == '') h++;//each grid that shares i with this blank
          else if(board[k][j].innerHTML == currentPlayer.opponent.letter) ho = true;
          else hx = true;
          if(board[i][k].innerHTML == '') v++;//each grid that shares j with this blank
          else if(board[i][k].innerHTML == currentPlayer.opponent.letter) ho = true;
          else vx = true;
        }
        if (h == numGrid) map2[i][j].r++;
        if (v == numGrid) map2[i][j].r++;
        if (ho && !hx) map2[i][j].c++;
        if (vo && !vx) map2[i][j].c++;

        var v1 = 0; var v1o = false; var v1x = false;
        if(i == j)//on v1
        {
          for (var k=0; k<numGrid; k++)//each grid on v1
          {
            if(board[k][k].innerHTML == '') v1++;
            else if(board[k][k].innerHTML == currentPlayer.opponent.letter) v1o = true;
            else v1x = true;
          }
        }
        if(v1 == numGrid) map2[i][j].r++;
        if(v1o && !v1x) map2[i][j].c++;

        var v2 = 0; var v2o = false; var v2x = false;
        if(i == numGrid-j-1)//on v2
        {
          for (var k=0; k<numGrid; k++)//each grid on v2
          {
            if(board[k][numGrid-k-1].innerHTML == '')v2++;
            else if(board[k][numGrid-k-1].innerHTML == currentPlayer.opponent.letter) v2o = true;
            else v2x = true;
          }
        }
        if(v2 == numGrid) map2[i][j].r++;
        if(v2o && !v2x) map2[i][j].c++;
      }
    }
  }
}

/*
New in AI0
If there's an only empty Coordinate in a certain row/column/diagonal, return it.
Judge by class name not innerHTML, so it can be used for simulations
*/
function AIhelper(direction, num) {
  if(direction == 'diag1') {
    //top left to bottom right
    for (var i=0; i<numGrid; i++) 
      if(!board[i][i].classList.contains(currentPlayer.letter)
        && !board[i][i].classList.contains(currentPlayer.opponent.letter)) 
        return new Coordinate(i,i);
  } else if (direction == 'diag2') {
    //top right to bottom left
    for (var i=0; i<numGrid; i++) 
      if(!board[i][numGrid-i-1].classList.contains(currentPlayer.letter)
        && !board[i][numGrid-i-1].classList.contains(currentPlayer.opponent.letter)) 
        return new Coordinate(i,numGrid-i-1);
  } else if (direction == 'hori') {
    //num, ?
    for (var i=0; i<numGrid; i++) 
      if(!board[num][i].classList.contains(currentPlayer.letter)
        && !board[num][i].classList.contains(currentPlayer.opponent.letter)) 
        return new Coordinate(num,i);
  } else if (direction == 'vert') {
    //?, num
    for (var i=0; i<numGrid; i++)
      if(!board[i][num].classList.contains(currentPlayer.letter)
        && !board[i][num].classList.contains(currentPlayer.opponent.letter)) 
        return new Coordinate(i,num);
  }
  return false;
}
