# Security

If you find a security problem, please don't open a public issue. Use the Report a vulnerability button on the Security tab of this repo, or get in touch through [katerinavassiliou.xyz](https://katerinavassiliou.xyz/?utm_source=github&utm_medium=souvenir).

Tell me what you found and how to reproduce it, and I'll reply within a few days.

The parts that matter most are how Souvenir reads and fetches page content, how it stores souvenirs, and anything that would let a web page reach into the extension. Souvenir only fetches http and https resources, keeps everything in the browser's local extension storage, and doesn't send anything anywhere.
