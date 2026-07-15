import * as settingModel from "../models/settingModel.js";

function toBillingSetting(currentBillNumber) {
  return {
    current_bill_number: currentBillNumber,
    next_bill_number: currentBillNumber + 1,
  };
}

export default class SettingLogic {
  async getBillingSetting() {
    return toBillingSetting(await settingModel.getCurrentBillNumber());
  }

  async updateBillingSetting(input) {
    const currentBillNumber = Number(input.current_bill_number);
    if (!Number.isInteger(currentBillNumber) || currentBillNumber < 0) {
      throw new Error("Current bill number must be a whole number of zero or greater");
    }

    const highestInvoiceBillNumber = await settingModel.getHighestInvoiceBillNumber();
    if (
      highestInvoiceBillNumber !== null
      && currentBillNumber < highestInvoiceBillNumber
    ) {
      throw new Error(
        `Current bill number cannot be lower than the highest existing invoice (${highestInvoiceBillNumber})`,
      );
    }

    await settingModel.setCurrentBillNumber(currentBillNumber);
    return toBillingSetting(currentBillNumber);
  }
}
