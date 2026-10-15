const DB_NAME='garment-quality-local';
const STORE='workspace';
const ACTIVE='active';

function openStore(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(new Error('Local database is blocked by another tab.'));
  });
}

export async function loadDataset(){
  const database=await openStore();
  return new Promise((resolve,reject)=>{
    const transaction=database.transaction(STORE,'readonly');
    const request=transaction.objectStore(STORE).get(ACTIVE);
    request.onsuccess=()=>resolve(request.result||null);
    request.onerror=()=>reject(request.error);
    transaction.oncomplete=()=>database.close();
    transaction.onabort=()=>{database.close();reject(transaction.error)};
  });
}

export async function saveDataset(data){
  const database=await openStore();
  return new Promise((resolve,reject)=>{
    const transaction=database.transaction(STORE,'readwrite');
    transaction.objectStore(STORE).put(data,ACTIVE);
    transaction.oncomplete=()=>{database.close();resolve()};
    transaction.onerror=()=>{database.close();reject(transaction.error)};
    transaction.onabort=()=>{database.close();reject(transaction.error)};
  });
}
