import { HISTORY_STORAGE_KEY, RECORDS_STORAGE_KEY } from '../utils/constants';
import { formatDateTime } from '../utils/helpers';

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export const healthRecordService = {
  acceptedTypes: ['application/pdf', 'image/png', 'image/jpeg'],
  maxFileSize: 10 * 1024 * 1024,

  getRecords() {
    return read(RECORDS_STORAGE_KEY, []);
  },

  addRecord(record) {
    const records = [record, ...this.getRecords()];
    this.addHistory({
      title: 'You uploaded a record',
      item: record.name,
      time: formatDateTime(),
    });
    return write(RECORDS_STORAGE_KEY, records);
  },

  getHistory() {
    return read(HISTORY_STORAGE_KEY, []);
  },

  addHistory(entry) {
    return write(HISTORY_STORAGE_KEY, [entry, ...this.getHistory()]);
  },

  seedHistory(healthId) {
    if (this.getHistory().length) return this.getHistory();
    return write(HISTORY_STORAGE_KEY, [
      {
        title: 'Identity verification completed',
        item: `Health Services ID ${healthId}`,
        time: formatDateTime(),
      },
      {
        title: 'Citizen profile created',
        item: 'National Health Services Portal',
        time: formatDateTime(),
      },
    ]);
  },
};
