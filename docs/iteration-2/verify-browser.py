from playwright.sync_api import sync_playwright
import json
from pathlib import Path
root = Path(__file__).resolve().parent / 'screenshots'
root.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 errors=[]; results=[]
 page=browser.new_page()
 page.on('pageerror',lambda err: errors.append(str(err)))
 for width,label in [(1440,'desktop'),(768,'tablet'),(375,'mobile')]:
  page.set_viewport_size({'width':width,'height':900 if width>375 else 812})
  for route,name in [('/','home'),('/campaigns','explore'),('/campaigns/1','detail'),('/create','create')]:
   page.goto('http://localhost:5173'+route);page.evaluate('document.fonts.ready')
   assert page.locator('h1').count()==1
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (route,width,'overflow')
   assert page.evaluate("document.fonts.check('800 20px Manrope') && document.fonts.check('400 16px Inter')")
   page.screenshot(path=str(root/f'{name}-{label}.png'),full_page=True)
   results.append(f'{name} {width}px: no overflow, fonts loaded, screenshot captured')
 page.set_viewport_size({'width':1440,'height':900})
 for i,status in [(1,'Active'),(2,'Active'),(3,'Successful'),(4,'Failed'),(5,'Cancelled'),(6,'Active')]:
  page.goto(f'http://localhost:5173/campaigns/{i}')
  assert page.locator('.funding-panel dd').last.inner_text()==status
  progress=page.get_by_role('progressbar'); assert float(progress.get_attribute('aria-valuenow'))<=100
  assert page.locator('.funding-panel button').is_disabled()
  if i>1: page.screenshot(path=str(root/f'detail-state-{i}.png'),full_page=True)
 page.goto('http://localhost:5173/create');page.get_by_role('button',name='Review demo campaign').click()
 assert page.locator('[aria-invalid=true]').count()==3
 assert page.locator('#title').evaluate('(e)=>e===document.activeElement')
 page.locator('#title').fill('A shared space');page.locator('#description').fill('A reading room for our neighbourhood.');page.locator('#goal').fill('0')
 page.locator('#duration').fill('31');page.get_by_role('button',name='Review demo campaign').click()
 assert page.locator('#goal').get_attribute('aria-invalid')=='true'
 assert page.locator('#duration').get_attribute('aria-invalid')=='true'
 page.screenshot(path=str(root/'create-validation.png'),full_page=True)
 page.locator('#goal').fill('4');page.locator('#duration').fill('30');page.get_by_role('button',name='Review demo campaign').click()
 assert page.get_by_role('status').is_visible()
 assert 'No campaign was created' in page.get_by_role('status').inner_text()
 page.reload();assert page.locator('#title').input_value()==''
 page.get_by_role('button',name='Wallet preview').click();assert page.get_by_role('dialog').is_visible()
 page.screenshot(path=str(root/'wallet-preview.png'),full_page=True)
 page.keyboard.press('Escape');assert not page.get_by_role('dialog').is_visible()
 assert page.get_by_role('button',name='Wallet preview').evaluate('(e)=>e===document.activeElement')
 page.goto('http://localhost:5173/');page.keyboard.press('Tab');assert page.locator('.skip-link').evaluate('(e)=>e===document.activeElement')
 page.emulate_media(reduced_motion='reduce');assert page.locator('.button').first.evaluate("e=>getComputedStyle(e).transitionDuration")=='0s'
 page.goto('http://localhost:5173/campaigns/unknown');assert 'isn’t here' in page.locator('h1').inner_text()
 assert not errors,errors
 print(json.dumps({'viewports':results,'checks':['six statuses and capped progress','disabled financial actions','required, positive goal, and 30-day boundary validation','local review, no persistence','wallet dialog Escape and focus return','keyboard skip link','reduced motion','unknown route fallback'],'browser_errors':errors},indent=2))
 browser.close()
