// Loading SDK 
var AWS = require('aws-sdk');
var fs = require('fs');
//Creating EC2 object for the regin : us-west-2
var ec2 = new AWS.EC2({region: 'us-west-2'});


//initializing params
var params = {
	ImageId: 'ami-01f05461',  
	InstanceType: 't2.medium', //General purpose
	MinCount: 1,              //minimum number of EC2 instances to launch
    MaxCount: 1,              //maximum number of EC2 instances to launch
	KeyName: 'aws_instance1', //Keypair name
	SecurityGroupIds: ['sg-aaea2bd3'] 
};

//Creating an EC2 instance
ec2.runInstances(params, function(err, data){
	if (err) {
	 console.log("Could not create an instance", err); 
	 return; 
	}
	var instanceId = data.Instances[0].InstanceId;
	console.log("\nCreated instance with ID: ", instanceId);
	console.log(data);
	console.log("\n-------------------------Waiting for the EC2 instance to initialize---------------")
	ec2.waitFor('instanceStatusOk', {InstanceIds:[instanceId] }, function(err, data1) {
		if (err){
	  		console.log(err, err.stack); 
		}  
		else {
			ec2.describeInstances( {InstanceIds: [instanceId] }, function(err, data2) {
  				if (err) console.log(err, err.stack); // an error occurred
  				else     
  				{
  				publicIP = data2.Reservations[0].Instances[0].PublicIpAddress;
  				console.log("\nEC2 instance public ip address : "+publicIP);
  			    var line = "redis-server ansible_host=" + publicIP + " ansible_user=ubuntu ansible_ssh_private_key_file=/Users/Pooja_Jawale/Devops/Milestone-3/aws-instance/aws_instance1.pem";
     			var inventory_data = line;

   				fs.writeFile("Inventory",inventory_data,function(err){
   	 		   	if(err){
   	 			console.log(err);
   	 			}
   	 			console.log("\n----------------------------Created Inventory file------------------------------");
   	 			})
  		       } 
			});
		}   
    });
});
