//#######################################################
//############### HANDLE UPDATE USER DATA ###############
//#######################################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../../config/systemMessages.js';

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { usersModel } from '../../models/usersModel.js';
import { usersHistoryModel } from '../../models/usersHistoryModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { requestUserCheck } from '../../functions/requestUserCheck.js'; 
import { getUser } from '../../functions/getUser.js';
import { getUserByIdUnfiltered } from '../../functions/getUserById.js';
import { getPlatformData } from '../../functions/getPlatformData.js';

//////////////////////////////////////
////// RESULT SENDING FUNCTIONS //////
//////////////////////////////////////
import { resSendOk } from '../../functions/resSend/resSendOk.js';

//////////////////////////////
////// HELPER FUNCTIONS //////
//////////////////////////////
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';
import { isNullOrEmpty } from '../../functions/helpers/isNullOrEmpty.js';
import { deepMerge } from '../../functions/helpers/deepMerge.js'; 

//////////////////////////////////////////
////// MALICIOUS ACTIVITY FUNCTIONS //////
//////////////////////////////////////////
import { logMalicious } from '../../functions/malicious/logMalicious.js'; 

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
async function handleUpdateUserMeta(app, req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0
  };
  let msg = {}
  
  try {

    //##########################
    //##### SUBMITTED DATA #####
    //##########################

    //////////////////////
    ////// CHECK SUBMITTED DATA //////
    //////////////////////
    if (
      isNullOrEmpty(req.body.csrf)
    ) {

      msg[4] = sysMsg[4];

      logMalicious(req, "4");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //#########################
    //##### CHECK REQUEST #####
    //#########################

    //////////////////////
    ////// CHECK PLATFORM //////
    //////////////////////
    let platform = req.params.fromPlatform;
    let platformData = await getPlatformData(platform);
    if (!platformData) {
 
      msg[1] = sysMsg[1];

      logMalicious(req, "1");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //////////////////////
    ////// CHECK USER //////
    ////////////////////// 
    const tokenData = await requestUserCheck(app, req, res, platformData);

    //////////////////////
    ////// GET CURRENT USER DATA //////
    //////////////////////
    let userData = await getUser(tokenData.user_email, platform);
    if (!userData) {
      
      msg[18] = sysMsg[18];

      logMalicious(req, "18");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //##########################
    //##### HANDLE REQUEST #####
    //########################## 

    let userID = userData.userID;
    let tokenUserID = req.body.auth_state.userID;

    if (userID === tokenUserID) {

      let newUserMeta = req.body.auth_state.userMeta;

      let oldUserMeta = userData.userData[platform].user_meta;

      userData.userData[platform].user_meta.dashboard_layout = {
        sections: {
          "row-main": [{ "id": "column-main", "inputs": [] }],
          "row-sidebar": [{ "id": "column-sidebar", "inputs": [] }]
        },
        links: {}
      }

      let mergedMeta = deepMerge({}, oldUserMeta);
      deepMerge(mergedMeta, newUserMeta);

      let oldDbData = await getUserByIdUnfiltered(userID, platform);

      const backupTime = theEpochTime();

      await usersHistoryModel.create({
        user_id: oldDbData.user_id,
        platform: oldDbData.platform,
        time_saved: backupTime,
        data: oldDbData,
      }, async function (err, createdDocument) {
        if (err) {

          msg[31] = sysMsg[31];

        } else {
          let fieldPath = "data." + platform + ".user_meta";
          let filter = { user_id: userID };
          let update = {
            $set: {
              [fieldPath]: mergedMeta,
            }
          };
          let opts = { upsert: true };
          await usersModel.collection.updateOne(filter, update, opts);
        }

      });
    }

    outputResult['status'] = 1;
    outputResult['qry'] = 1;

    resSendOk(req, res, outputResult, msg);

    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    msg[0] = sysMsg[0];
    resSendOk(req, res, outputResult, msg);

    return null;
  }
}

export default handleUpdateUserMeta;