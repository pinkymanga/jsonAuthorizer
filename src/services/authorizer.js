import AccountDto from '../models/accountDto.js';
import ResposeDto from '../models/responseDto.js';
import {getAccount, isAccountInstanced} from '../models/account.js';
import {violations} from '../utils/violationsEnum.js';
import AccountTransaction from '../models/accountTransaction.js';

const acctions = {
    account: (args) =>{
        return !isAccountInstanced()? createAccount(args): alreadyInitializedRespose(getAccount());
    },
    transaction: async (args) =>{

        const violations = await Promise.all([
            rules.accountNotInitialized(),
            rules.cardNotActive(),
        ]
        ).then(values => {
            console.log("solved: " + values.length);
            return values.filter(n => n);
        }, reason => {//todo check list
            console.log("reason: " + reason);
            return [reason];
        });

        if(violations.length === 0){
            return enqueueNewTransaction(args);
        }

        return new ResposeDto({}, violations);
    }
};

const createAccount = (args) => {
    console.log('Creating account... ' + JSON.stringify(args));
    const account = getAccount(args['active-card'], args['available-limit']);
    console.log('Created account... ' + JSON.stringify(account));
    return new ResposeDto(new AccountDto(account.activeCard, account.availableLimit));
};

const alreadyInitializedRespose = (account)=> {
    return new ResposeDto(
        new AccountDto(account.activeCard, account.availableLimit), [violations.INITIALIZED]
    );
};

const enqueueNewTransaction = (args) => {
    const account = getAccount();
    const available = (account.lastTransaction ?
        account.lastTransaction.available :
        account.availableLimit) - args.amount;

    if (account.isTransactionFull) {
        account.dequeueTransaction();
    }
    const transaction = new AccountTransaction(args.amount, args.time, available, args.merchant);
    account.enqueueTransaction(transaction);

    return new ResposeDto(new AccountDto(account.activeCard, transaction.available));
}


const rules = {
    cardNotActive: () =>{
        return new Promise((resolve, reject) => {
            if(isAccountInstanced() && !getAccount().activeCard){
                reject(violations.CARD_NOT_ACTIVE);
            }
            resolve(null);
        });
    },
    accountNotInitialized: () =>{
        return new Promise((resolve, reject) => {
            if(!isAccountInstanced()){
                reject(violations.NOT_INITIALIZED);
            }
            resolve(null);
        });
    }
    
};

export const authorizer = (row) => {
    return acctions[Object.keys(row)[0]](Object.values(row)[0]);
}