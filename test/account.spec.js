import {getAccount} from '../src/models/account';

test('Should create a singleton Account', () => {
  let account = getAccount(true, 666);
  expect(account.activeCard).toBe(true);
  expect(account.availableLimit).toBe(666);

  let account2 = getAccount(false, 123);
  expect(account2.activeCard).toBe(true);
  expect(account2.availableLimit).toBe(666);

})