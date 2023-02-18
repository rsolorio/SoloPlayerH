/// <reference lib="webworker" />

/*
Web worker that receives an IColorExtractionData object and returns a list of IRgbaColor objects.
*/

// You can import vanilla js files using: importScripts()
import { ColorExtractorFactory, IColorExtractionData } from '../models/color-extractor-factory.class';

addEventListener('message', message => {
  const data = message.data as IColorExtractionData;
  const extractor = ColorExtractorFactory.get(data.extractorName);
  // Although this method is returning a list of objects, the webworker will only pass regular properties, but not "getter" properties.
  const response = extractor.extract(data);
  postMessage(response);
});
