/**
 * @param {HTMLElement} $block
 */
export default function decorate(block) {
  console.log(block);

  let deliveryType = Array.from(block.children)[2]?.textContent?.trim();
  let inputs = block.querySelectorAll('.dynamicmedia-image > div');
      
  let inputsArray = Array.from(inputs);
  if(inputsArray.length < 2) {
    console.log("Missing inputs, expecting 2, ensure both the image and DM URL are set in the dialog");
    return;
  }
  // Get DM Url input
  let dmUrlEl = inputs[3]?.getElementsByTagName("a")[0];
  let rotate = inputs[4]?.textContent?.trim();
  let flip = inputs[5]?.textContent?.trim();
  
  if(deliveryType === 'dm' && dmUrlEl){
      // Ensure S7 is loaded
      if (typeof s7responsiveImage !== 'function') {
        console.error("s7responsiveImage function is not defined, ensure script include is added to head tag");
        return;
      }
    
      // Get image
      let imageEl = inputs[1]?.getElementsByTagName("img")[0];
      if(!imageEl) {
        console.error("Image element not found, ensure it is defined in the dialog");
        return;
      }
    
      let imageSrc = imageEl.getAttribute("src");
      if(!imageSrc) {
        console.error("Image element source not found, ensure it is defined in the dialog");
        return;
      }
    
      // Get imageName from imageSrc expected in the format /content/dam/<...>/<imageName>.<extension>
      let imageName = imageSrc.split("/").pop().split(".")[0];
    
      if(!dmUrlEl) {
        console.error("DM Url not found, make sure its set in the dialog");
      }else{
        let dmUrl = dmUrlEl.getAttribute("href");
      
        imageEl.setAttribute("data-src", dmUrl + (dmUrl.endsWith('/') ? "" : "/") + imageName);
        //imageEl.setAttribute("src", dmUrl + (dmUrl.endsWith('/') ? "" : "/") + imageName);
        imageEl.setAttribute("src", dmUrl + (dmUrl.endsWith('/') ? "" : "/") + imageName);
        imageEl.setAttribute("data-mode", "smartcrop");
      
        s7responsiveImage(imageEl);
        dmUrlEl.remove();
      }
  }
  if(deliveryType === 'dm-openapi'){
    
   
  }
  block.children[6]?.remove();
  block.children[5]?.remove();
  block.children[4]?.remove();
  block.children[3]?.remove();
  block.children[2]?.remove();  
}
