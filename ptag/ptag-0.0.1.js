function createFetch(){return function(e,t,n){var c={"content-type":"application/json"};n&&(c["x-gtm-server-preview"]=n),fetch(e,{method:"post",headers:c,body:JSON.stringify(t)})}}window["ptag.$fetch"]=createFetch();