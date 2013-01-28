var http=require("http");
var fs=require("fs");
var io=require("socket.io");
var chat=require("./loudroom.js");
var sanitizer=require("sanitizer");
function send(data,type,res)
{
	if(type){res.setHeader("Content-Type",type);}
	res.setHeader("Content-Encoding","utf-8");
	res.writeHead(200);
	res.end(data);
}
function badurl(url,res)
{
	res.writeHead(404);
	console.log("Failed query for "+url);
}
var server=http.createServer(function(req,res)
{
	var txttest=/room[0-9]+.txt/;
	if(req.url=="/")
	{
		fs.readFile(__dirname+"/getloud.html",function(err,data)
		{
			if(err){badurl(req.url,res);}
			send(data,"text/html",res);
		});
	}
	else if(req.url=="/jquery")
	{
		fs.readFile(__dirname+"/jquery.min.js",function(err,data)
		{
			if(err){badurl(req.url,res);}
			send(data,"text/javascript",res);
		});
	}
	else if(req.url=="/favicon.ico")
	{
		fs.readFile(__dirname+"/favicon.ico",function(err,data)
		{
			if(err){badurl(req.url,res);}
			send(data,"image/x-icon",res);
		});
	}
	else if(txttest.exec(req.url))
	{
		fs.readFile(__dirname+"/"+req.url,function(err,data)
		{
			if(err){badurl(req.url,res);}
			send(data,false,res);
		});
	}
	else{badurl(req.url,res);}
});
var sio=io.listen(server);
var posts=Array();
var index=0;
var serial=1;
var guestserial=0;
var active_rooms={};
function random(l,u)
{
	return ((u-l)*Math.random())+l;
}
sio.configure(function(){
	sio.set("transports",["xhr-polling"]);
	sio.set("polling duration",20);
});
server.listen(process.env.PORT || 1776);
socket=
sio.sockets.on("connection",function(socket)
{
	socket.nickname="Guest"+guestserial;
	guestserial++;
	socket.on("newpost",function(data)
	{
		data=sanitizer.escape(data);
		var post={"id":index,"rot":random(-45,45),"top":random(10,70),"left":random(0,70),"msg":socket.nickname+": "+data,"serial":serial};
		fs.writeFile(__dirname+"/room"+serial+".txt",data+"\nChat room\n----------\n",function(err)
		{
			if(err)
			{
				socket.emit("failedpost");
			}
			else
			{
				fs.writeFile(__dirname+"/name"+serial,data,function(err)
				{
					if(err)
					{
						fs.unlink(__dirname+"/room"+serial+".txt",function(err){});
						socket.emit("failedpost");
					}
					else
					{
						sio.sockets.emit("update",post);
						//if(posts[index]){sio.sockets.emit("remove",index);}
						posts[index]=post;
						index++;
						if(index>19){index=0;}
						serial++;
					}
					
				});
			}
			
		});
	});
	socket.on("enterroom",function(data)
	{
		if(active_rooms[data])
		{
			active_rooms[data].enter(socket);
		}
		else
		{
			active_rooms[data]=chat.create_room(data,socket,sio);
		}
		if(socket.room)
		{
			socket.room.evict(socket);
		}
		socket.room=active_rooms[data];
	});
	socket.on("newnick",function(data)
	{
		data=sanitizer.escape(data);
		if(data!=""){socket.nickname=data;}
	});
	for(var x=0;x<20;x++)
	{
		if(posts[x])
		{
			socket.emit("update",posts[x]);
		}
	}
});
