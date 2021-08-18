// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
const { MakeReservationDialog } = require('./componentDialogs/makeReservationDialog');
const { CancelReservationDialog } = require('./componentDialogs/cancelReservationDialog')
const {LuisRecognizer, QnAMaker}  = require('botbuilder-ai');



class RRBOT extends ActivityHandler {
    constructor(conversationState,userState) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.makeReservationDialog = new MakeReservationDialog(this.conversationState,this.userState);
        this.cancelReservationDialog = new CancelReservationDialog(this.conversationState,this.userState);
   
        
        this.previousIntent = this.conversationState.createProperty("previousIntent");
        this.conversationData = this.conversationState.createProperty('conservationData');
        

        /*const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${ process.env.LuisAPIHostName }.api.cognitive.microsoft.com`
        }, {
            includeAllIntents: true
        }, true); */

        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,          
            endpoint: `https://westus.api.cognitive.microsoft.com/`
        }, {
          
            apiVersion: 'v3'
        }, true);

       
        const qnaMaker = new QnAMaker({
            knowledgeBaseId: process.env.QnAKnowledgebaseId,
            endpointKey: process.env.QnAEndpointKey,
            host: process.env.QnAEndpointHostName
        });
    
   
        
        
        this.qnaMaker = qnaMaker;


        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {

        const luisResult = await dispatchRecognizer.recognize(context)
        const intent = LuisRecognizer.topIntent(luisResult); 
       
        
        const entities = luisResult.entities;

        await this.dispatchToIntentAsync(context,intent,entities);
        
        await next();

        });

    this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });   
    this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context)
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

  

    async sendWelcomeMessage(turnContext) {
        const { activity } = turnContext;

        // Iterate over all new members added to the conversation.
        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                //const welcomeMessage = `Welcome to Alpha Hotel & Restaurant  ${ activity.membersAdded[idx].name }. `;
                const welcomeMessage = `Welcome to Alpha Hotel & Restaurant. What would you like to do today ?`;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        var reply = MessageFactory.suggestedActions(['Order Online','Restaurant Details'],'I can help you with : ');
        await turnContext.sendActivity(reply);
    }

    async sendSuggestedActions_OrderOnline(turnContext) {
       var reply = MessageFactory.suggestedActions(['Show Menu','Book Table','Cancel Reservation', 'Vegitarian Option','Gluten Free Option']);
        await turnContext.sendActivity(reply);
    }

    async sendSuggestedActions_RestaurantDetail(turnContext) {
        var reply = MessageFactory.suggestedActions(['Restaurant Hours','Private Dining','Giftcards','Helpdesk', 'Feedback', 'Customized Menus', 'Recipes']);
         await turnContext.sendActivity(reply);
     }

    

    async dispatchToIntentAsync(context,intent,entities){

        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context,{});
        const conversationData = await this.conversationData.get(context,{});   

        if(previousIntent.intentName && conversationData.endDialog === false )
        {
           currentIntent = previousIntent.intentName;

        }
        else if (previousIntent.intentName && conversationData.endDialog === true)
        {
             currentIntent = intent;

        }
        else if(intent == "None" && !previousIntent.intentName)
        {

            var result = await this.qnaMaker.getAnswers(context)
            await context.sendActivity(`${ result[0].answer}`);
            await this.sendSuggestedActions(context);

            if(result[0].answer.includes("You can place the Order at"))
            {
                await this.sendSuggestedActions_OrderOnline(context);
            }

            if(result[0].answer.includes("We are located at"))
            {
                await this.sendSuggestedActions_RestaurantDetail(context);
            }

        }
        
        else
        {
            currentIntent = intent;
            await this.previousIntent.set(context,{intentName: intent});

        }
    switch(currentIntent)
    {

        case 'Make_Reservation':
        console.log("Inside Make Reservation Case");
        await this.conversationData.set(context,{endDialog: false});
        await this.makeReservationDialog.run(context,this.dialogState,entities);
        conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
        if(conversationData.endDialog)
        {
            await this.previousIntent.set(context,{intentName: null});
            await this.sendSuggestedActions(context);

        } 
        break;


        case 'Cancel_Reservation':
            console.log("Inside Cancel Reservation Case");
            await this.conversationData.set(context,{endDialog: false});
            await this.cancelReservationDialog.run(context,this.dialogState);
            conversationData.endDialog = await this.cancelReservationDialog.isDialogComplete();
            if(conversationData.endDialog)
            {   
                await this.previousIntent.set(context,{intentName: null});
                await this.sendSuggestedActions(context);
    
            }
            
            break;


        default:
            console.log("Did not match Make Reservation case");
            break;
    }


    }


}



module.exports.RRBOT = RRBOT;
