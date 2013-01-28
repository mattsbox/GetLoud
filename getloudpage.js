(function(){
var socket,scroll;
$(document).ready(function(){
	socket=io.connect("localhost");
	socket.on("update",function(data)
	{
		$("#content").append("<div class=\"post\" id=\"msg"+data["serial"]+"\" style=\"transform:rotate("+data["rot"]+"deg);-moz-transform:rotate("+data["rot"]+"deg);-webkit-transform:rotate("+data["rot"]+"deg);-o-transform:rotate("+data["rot"]+"deg);left:"+data["left"]+"%;top:"+data["top"]+"%;\"><a href=\"#\">"+data["msg"]+"</a></div>");
		$("#msg"+data["serial"]+" a").click(function()
		{
			socket.emit("exit",{});
			socket.emit("enterroom",data["serial"]);
		});
	});
	socket.on("remove",function(data)
	{
		$("#msg"+data).remove();

	});
	socket.on("enterroom",function(data)
	{
		$("#sidebar").html(data);
		$("#chatcontent").jScrollPane({showArrows:$(this).is(".arrow")});
		scroll=$("#chatcontent").data('jsp');
		$("#chatsubmit").click(chat);
		$("#chatmessage").keydown(function(e){if(e.keyCode==13){chat();}});
	});
	socket.on("leaveroom",function(data)
	{
		
	});
	socket.on("newchat",function(data)
	{
		$(".jspPane").append(data+"<br/>");
		scroll.reinitialise();
		scroll.scrollToBottom();
	});
	socket.on("failedpost",function()
	{
		message("Oh no, we couldn't post your message! Try again in a minute");
	});
	$("#message").keydown(function(e){if(e.keyCode==13){post();}});
	$("#submit").click(post);
	$("#nickbutton").click(newnick);
	newnick();
});
function newnick()
{
	message("Would you like to give yourself a nickname? Type it in this box<br/><input type=\"text\" id=\"newnick\"/>");
	$("#newnick").keydown(function(e)
	{
		if(e.keyCode==13)
		{
			socket.emit("newnick",$("#newnick").val());
			$("#msg").remove();
		}
	});
}
function message(msg)
{
	$("#msg").remove();
	e=document.createElement("DIV");
	$(e).attr("id","msg");
	e.style.backgroundColor="#BBBBFF";
	e.style.height="100px";
	e.innerHTML=msg+"<br/><br/><a id=\"msga\" style=\"border-bottom:1px solid black\">Click me and I'll go away</a>";
	document.body.appendChild(e);
	$("#msga").click(function()
	{
		$("#msg").remove();
	});
}
function chat()
{
	var chat=$("#chatmessage").val();
	if(chat!="")
	{
		socket.emit("newchat",chat);
		$("#chatmessage").val("");
	}
}
function post()
{
	var post=$("#message").val();
	if(post!="")
	{
		socket.emit("newpost",$("#message").val());
	}
}
})();

