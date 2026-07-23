#!/usr/bin/env python3
import sys
import json
import re
import base64
import urllib.request
from email import message_from_bytes
from email.policy import default

def extract_email(str_val):
    if not str_val:
        return ''
    match = re.search(r'<([^>]+)>', str(str_val))
    return (match.group(1) if match else str(str_val)).strip().lower()

def main():
    try:
        raw_data = sys.stdin.buffer.read()
        parsed = message_from_bytes(raw_data, policy=default)

        raw_recipient = sys.argv[1] if len(sys.argv) > 1 else (parsed.get('To') or 'demo@xmorf.net')
        raw_sender = sys.argv[2] if len(sys.argv) > 2 else (parsed.get('From') or 'external@unknown.com')

        recipient = extract_email(raw_recipient)
        sender = extract_email(raw_sender)
        subject = str(parsed.get('Subject') or '(No Subject)')
        sender_name = str(parsed.get('From') or sender)

        text_body = ''
        html_body = ''
        attachments = []

        try:
            if parsed.is_multipart():
                for part in parsed.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get('Content-Disposition') or '')
                    filename = part.get_filename()

                    if filename or 'attachment' in content_disposition:
                        payload = part.get_payload(decode=True)
                        if payload:
                            attachments.append({
                                'name': filename or 'attachment',
                                'contentType': content_type,
                                'size': len(payload),
                                'content': base64.b64encode(payload).decode('utf-8')
                            })
                    else:
                        if content_type == 'text/html' and not html_body:
                            html_body = part.get_content()
                        elif content_type == 'text/plain' and not text_body:
                            text_body = part.get_content()
            else:
                content_type = parsed.get_content_type()
                if content_type == 'text/html':
                    html_body = parsed.get_content()
                else:
                    text_body = parsed.get_content()
        except Exception:
            text_body = raw_data.decode('utf-8', errors='ignore')[:10000]

        final_body = html_body if html_body else text_body
        if not final_body:
            final_body = raw_data.decode('utf-8', errors='ignore')[:10000]

        payload = json.dumps({
            'senderEmail': str(sender),
            'senderName': str(sender_name),
            'recipient': str(recipient),
            'subject': str(subject),
            'body': str(final_body),
            'bodyHtml': str(html_body) if html_body else '',
            'bodyText': str(text_body) if text_body else '',
            'attachments': attachments,
            'secret': 'xmorf_secret_webhook_key'
        }).encode('utf-8')

        req = urllib.request.Request(
            'http://127.0.0.1:5000/api/emails/incoming-webhook',
            data=payload,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            print("Webhook response:", res_body)
    except Exception as e:
        sys.stderr.write(f"Mail pipe python error: {e}\n")
        sys.exit(1)

if __name__ == '__main__':
    main()
