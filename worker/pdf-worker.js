self.onmessage = async event => {
  try {
    const pdf = await convertSubmission(event.data);
    self.postMessage({pdf}, [pdf.buffer]);
  } catch (error) {
    self.postMessage({error:String(error.message || error)});
  }
};
