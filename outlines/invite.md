The invite functionality allows users to send invites to other users.

### Invite data structure

*   `id`: ulid, it also acts as the secret invite code
*   `invitingUserId`: this is the user who is sending the invite
*   `inviteText`: this is the text sent to the user
*   `code`: this is text that is not visible to the invitees, but the inviting user can track invite performance with these codes
*   `limit`: this is the number of times the invite can be used
*   `used`: this is the number of times the invite has been used
*   `active`: this is a boolean that indicates if the invite is active or not. Invite gets automatically deactivated after the limit is reached

### Invite flow

The process for the user sending the invite:

1.  Log in
2.  Click on the Invites link in the nav bar
3.  See the list of existing invites with a filter on top. Each invite is represented by a card with all the fields and buttons to edit the invite, get the invite link, or show the QR with the invite link
4.  Click on the "New Invite" button.
5.  Fill in the form with the invite details.
6.  Get the invite link by clicking the "Get Invite Link" button.
7.  Show the QR code by clicking the "Show QR" button.
8.  Pass the link or the QR code to the invitee.

The process for the new user not using the app to accept the invite:

1.  Scan the QR code or click the invite link
2.  The invite link has the form of {hostname}/invite/accept/{id} 
3.  Open this page in the browser. Invite id is stored in the session. If the user hasn't a session, a new one is created.
4. User is regirected to the login/signup page
5. The page checks the session for the presence of invite id. 
- If the invite id is present, the page shows an additional section with invite details: 
invite sender name and the invite text. 
- If the invite is not active, it shows a message that the invite is not active. 
- There's also an explanation to the user that if they login or signup using this invite, 
the inviter will receive their contacts. 
- There is a buton to reject the invite, which deletes the invite from the session.
6. Once the user logs in or signs up, the invite response is being recorded in the database.
7. 'used' counter is incremented and 'active' is set to false if the limit is reached.

The process for the user using the app to accept the invite:
1. Open the QR scanner page from the navbar
2. Scan the QR code or user paste the invite link into a field on the page
3. Retrieve the invite information from the link by fetching it with an extra URI parameter "response=JSON"
4. Show the invite details: invite sender name and the invite text and whether the invite is active
5. The inviter is added as a contact automatically. This is done by sending an API request to the homebase.
Once the API request completes, a message is shown "Contact added" and a small "remove" button to 
remove the contact, undoing the addition.
5. There is a "Accept Invite" button to accept the invite 
6. Once the button is clicked, client-side JS sends a POST request to the invite url with 
the contact card of the invitee as the body of the request.

### Implementation plan:

1. Implement session management
2. Create a login/signup page
3. Create a module that generates an new Set-Cookie header based on updated session data 
3. Create an invite page
4. Create an accept invite route that redirect to the login/signup page
5. Create a reject invite page


