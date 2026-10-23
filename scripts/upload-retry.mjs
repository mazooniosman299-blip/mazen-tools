export function transientAssetUploadFailure(output) {
  return output.includes('/assets-upload-session') && /\[code: 10013\]/.test(output);
}
export async function retryAssetUpload(upload, {sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), report = () => {}} = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return await upload(); }
    catch (error) {
      if (!error.transientAssetUpload || attempt === 3) throw error;
      report(attempt);
      await sleep(attempt * 5000);
    }
  }
}
