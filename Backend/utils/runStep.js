const runStep = async (stepName, stepFunction) => {
  try {
    console.log(`${stepName}...`);

    const data = await stepFunction();

    return {
      success: true,
      data,
      error: null,
    };
  } catch (error) {
    console.error(`${stepName} failed:`, error.message);

    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

module.exports = {
  runStep,
};