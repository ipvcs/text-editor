import React, { useRef, useState, useEffect } from "react";
import IPFS from "ipfs-core";
import queryString from "query-string";
import Crypto from "crypto-js";

import Content from "./components/Content";

export default function App() {
  const [ipfs, setIpfs] = useState(null);
  const [initialValue, setInitialValue] = useState("");

  async function loadIPFS() {
    try {
      const _ipfs = await IPFS.create();
      setIpfs(_ipfs);
    } catch {
      console.error("error connecting to ipfs");
    }
  }

  async function loadInitialValue(cid) {
    try {
      for await (const file of ipfs.get(cid)) {
        if (!file.content) continue;

        const content = [];

        for await (const chunk of file.content) {
          content.push(chunk);
        }
        const arr = content[0];

        const textDecoder = new TextDecoder();
        const decoded = textDecoder.decode(arr);

        const decrypted = Crypto.AES.decrypt(decoded, "password");

        const decryptedString = decrypted.toString(Crypto.enc.Utf8);

        setInitialValue(decryptedString);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadIPFS();
  }, []);

  useEffect(() => {
    const query = queryString.parse(window.location.search);
    if (query.cid) {
      loadInitialValue(query.cid);
    }
  }, [ipfs]);

  const editorRef = useRef(null);

  const save = async () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      console.log(content);

      const encrypted = Crypto.AES.encrypt(content, "password").toString();

      console.log("encrypted", encrypted);

      const { cid } = await ipfs.add(encrypted);
      alert(`Saved at ${cid}`);
    }
  };

  return (
    <Content editorRef={editorRef} initialValue={initialValue} save={save} />
  );
}
