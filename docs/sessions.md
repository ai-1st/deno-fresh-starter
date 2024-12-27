

## Opinionated Decisions:

* Store session data in cookies rather than in a database on the server
* To max out density, use a positional array of values separated by commas
* Encrypt session data using AES-GCM
* Use a random salt as the first value in the array
* Use a version number as the second value in the array - the version denotes the structure of the array
* Sessions are retrieved from cookies and decrypted using a middleware
* core/sessions.ts provides functions for encrypting, decrypting, and injecting Set-Cookier headers into reponses
* Session values:
- random salt
- version number
- user ID (ulid)
- user login
- invite code


