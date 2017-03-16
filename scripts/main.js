$("input[name='username']").blur(function(){
	//enteredUsername = $("input[name='username']").val()
	
	var data={}
	data.enteredUsername = $("input[name='username']").val()
	alert(data.enteredUsername)
	$.ajax({
		type: "POST",
		url: '/checkUsername',
		data: data,
		dataType: 'application/json',
		success:function(result){
			if(result.error === false){
				alert("THis is the case");
			} else {
				const errorMessage = result.message;
			}
		}
})
	});

	// }).done(function ( result ) {
	// 	alert("ajax callback response:"+JSON.stringify(result));
	// })


