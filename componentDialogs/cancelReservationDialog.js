const https = require('https');
//const bodyParser = require('body-parser');
//const fetch = require('node-fetch');
let base64 = require('base-64');
//const app = express();
var nodemailer = require('nodemailer');


let testvar="ahdlhqaldhqldhl";
var username = 'SNC5MTAX';
var password = 'LRWSM8R7';



var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pmdev6989@gmail.com',
      pass: 'Msa_03031995'
    }
  });
  
  
  

function toIG(email,item ) {

  const data1 = JSON.stringify({
    "Items":[
      {
          "Id":item
      }	
  ],
  "KpHeaderLines":[
      {
          "Text":"This is my header",
          "Justification":"Left",
          "Big":false,
          "Red":false
      },
      {
          "Text":"Second header...",
          "Justification":"Left",
          "Big":false,
          "Red":false
      }        
  ],
  "KpFooterLines":[
      {
          "Text":"Sign the following....",
          "Justification":"Left",
          "Big":false,
          "Red":false
      },
      {
          "Text":"X__________________________________",
          "Justification":"Left",
          "Big":false,
          "Red":false
      }
  ]

  })



  
  var auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
  const options1 = {
    hostname: 'qatechsrv1.pos.qaigasp.com',
    port: 443,
    path: '/InfoGenesis/Api/TransactionServices/Orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
      'Content-Length': data1.length
    }
  }
  
  const req = https.request(options1, res => {
    console.log(`statusCode: ${res.statusCode}`)
  
    res.on('data', d => {
      process.stdout.write(d);
      const orderData1 = JSON.parse(d);

      console.log(orderData1);
      
      var mailOptions1 = {
        from: 'pmdev6989@gmail.com',
        to: email ,
        subject: 'Order receipt from Alpha Restaurant - '+orderData1.OrderNumber,
        text: 'That was easy! , Your Order has been successfully placed and the Order Number is '+ orderData1.OrderNumber + '. Your Order total including tax is '+orderData1.Subtotals.TotalAmount+". Thank you for Odering with us."
      };

  
  transporter.sendMail(mailOptions1, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });



    })
  })
  
  req.on('error', error => {
    console.error(error)
  })
  
  req.write(data1)
  req.end()
  

return(1);



  
}
  


var auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
var OrderDetails;
const {WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const {ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt  } = require('botbuilder-dialogs');

const {DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const {CardFactory} = require('botbuilder');

const RestaurantCard = require('../resources/adaptiveCards/food')
//const RestaurantCard = require('../resources/adaptiveCards/food')

const CARDS = [

    RestaurantCard
];

const CHOICE_PROMPT    = 'CHOICE_PROMPT';
const CONFIRM_PROMPT   = 'CONFIRM_PROMPT';
const TEXT_PROMPT      = 'TEXT_PROMPT';
const NUMBER_PROMPT    = 'NUMBER_PROMPT';
const DATETIME_PROMPT  = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog ='';

class CancelReservationDialog extends ComponentDialog {
    
    constructor(conservsationState,userState) {
        super('cancelReservationDialog');



this.addDialog(new TextPrompt(TEXT_PROMPT));
this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
this.addDialog(new NumberPrompt(NUMBER_PROMPT));
this.addDialog(new DateTimePrompt(DATETIME_PROMPT));


this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
    this.firstStep.bind(this),  // Ask confirmation if user wants to make reservation?
    this.confirmStep.bind(this), // Show summary of values entered by user and ask confirmation to make reservation
    this.summaryStep.bind(this),
    this.postToIG.bind(this)
           
]));




this.initialDialogId = WATERFALL_DIALOG;


   }

   async run(turnContext, accessor) {
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
        await dialogContext.beginDialog(this.id);
    }
}

async firstStep(step) {
endDialog = false;
// Running a prompt here means the next WaterfallStep will be run when the users response is received.
await step.context.sendActivity({
    text: 'Enter the Item ID from the below table to place the order:',
    attachments: [CardFactory.adaptiveCard(CARDS[0])]
});

return await step.prompt(TEXT_PROMPT, '');
      
}

async confirmStep(step){

    step.values.reservationNo = step.result

    var msg = ` You have entered following values: \n Item Number: ${step.values.reservationNo}`
 //console.log(step.values.reservationNo);
    await step.context.sendActivity(msg);

    return await step.prompt(CONFIRM_PROMPT, 'Are you sure that all values are correct and you want to place the order?', ['yes', 'no']);
}

async summaryStep(step){


    if(step.result===true)
    {
      // Business

      
        var msgEmail= 'Enter the Email address to receive the order receipt'
    

    await step.context.sendActivity(msgEmail);
    
    return await step.prompt(TEXT_PROMPT, '');
      

      
      //console.log(testvar);
      /*  console.log("statusCode:", res.statusCode);


    
let jsondata;   
var obj;
fetch('https://qatechsrv1.pos.qaigasp.com/InfoGenesis/Api/TransactionServices/Orders/', {
    method: 'POST',
    body: data,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
        'Content-Length': data.length
      }
}).then(res => res.json())
  .then(json => console.log(json));

  */



  
   
    
    }

    else{
        await step.context.sendActivity("Please review the menu and order again , Thanks.");
        endDialog = true;
        return await step.endDialog();   

    }
   
}

async postToIG(step){

    step.values.email = step.result;

    console.log("Inside the Post to IG function");

/*
    const data = new TextEncoder().encode(
        JSON.stringify({

            "Items":[
                {
                    "Id":step.values.reservationNo
                }	
            ],
            "KpHeaderLines":[
                {
                    "Text":"This is my header",
                    "Justification":"Left",
                    "Big":false,
                    "Red":false
                },
                {
                    "Text":"Second header...",
                    "Justification":"Left",
                    "Big":false,
                    "Red":false
                }        
            ],
            "KpFooterLines":[
                {
                    "Text":"Sign the following....",
                    "Justification":"Left",
                    "Big":false,
                    "Red":false
                },
                {
                    "Text":"X__________________________________",
                    "Justification":"Left",
                    "Big":false,
                    "Red":false
                }
            ]

        })
      )
      
      const options = {
        hostname: 'qatechsrv1.pos.qaigasp.com',
        port: 443,
        path: '/InfoGenesis/Api/TransactionServices/Orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth,
          'Content-Length': data.length
        }
      }
      
      const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`)
       //  testvar = "testing";
        res.on('data', d => {

           // process.stdout.write(d);
           const orderData = JSON.parse(d);

          console.log(orderData);
           
           var mailOptions = {
            from: 'pmdev6989@gmail.com',
            to: step.values.email ,
            subject: 'Order receipt from Alpha Restaurant - '+orderData.OrderNumber,
            text: 'That was easy! , Your Order has been successfully placed and the Order Number is '+ orderData.OrderNumber + '. Your Order total including tax is '+orderData.Subtotals.TotalAmount+". Thank you for Odering with us."
          };

      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      



        })

       
      })
      
      req.on('error', error => {
        console.error(error)
      })
      
      req.write(data)
      req.end() */
      
var result= toIG(step.values.email , step.values.reservationNo);

if(result){}
       
await step.context.sendActivity("Your Order has been successfully placed your order details has been sent to your email address. Thank you for Ording at Alpha Restaurant.");
endDialog = true;
return await step.endDialog(); 


}

async isDialogComplete(){
    return endDialog;
}
}

module.exports.CancelReservationDialog = CancelReservationDialog;
//export const OrderData = OrderDetails;
