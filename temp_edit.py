import re, pathlib
path = pathlib.Path('app/settings/page.tsx')
text = path.read_text()
pattern = r'(<Label className="text-slate-200">Password</Label>\s*<div className="flex flex-col sm:flex-row gap-3">\s*<Input[\s\S]*?Change Password\s*</Button>\s*</div>)'
new = """<Label className=\"text-slate-200\">Password</Label>\n                    <div className=\"flex flex-col sm:flex-row gap-3\">\n                      <div className=\"relative flex-1\">\n                        <Input\n                          type={showSecurityPassword ? \"text\" : \"password\"}\n                          value=\"**********\"\n                          readOnly\n                          className={${inputClass} flex-1 select-none pr-10}\n                        />\n                        <button\n                          type=\"button\"\n                          onClick={() => setShowSecurityPassword((v) => !v)}\n                          className=\"absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white\"\n                          aria-label={showSecurityPassword ? \"Hide password\" : \"Show password\"}\n                        >\n                          {showSecurityPassword ? <EyeOff className=\"w-4 h-4\" /> : <Eye className=\"w-4 h-4\" />}\n                        </button>\n                      </div>\n                      <Button variant=\"outline\" className={whiteButton}>\n                        Change Password\n                      </Button>\n                    </div>"""
new_text, n = re.subn(pattern, new, text, flags=re.MULTILINE)
print('replaced', n)
if not n:
    raise SystemExit('pattern not found')
path.write_text(new_text)
