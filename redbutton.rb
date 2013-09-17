#!/usr/bin/env ruby

require 'dream_cheeky'

LIGHTS = "1 2 3 4 5 6"

DreamCheeky::BigRedButton.run do

  def reset
    Process.kill("SIGKILL", $alarm_pid) if $alarm_pid
    Process.kill("SIGKILL", $zombie_pid) if $zombie_pid
    Process.kill("SIGKILL", $chromecast_pid) if $chromecast_pid
  end

  close do
    reset
    $alarm_pid = spawn('ssh', 'dkordik@192.168.2.4', "say -v 'Zarvox' -r 80 'Disabling alarm sequence'")
    $zombie_pid = spawn({"LIGHTS" => LIGHTS}, ['./onWithSunTemp', './onWithSunTemp'])
    $chromecast_pid = spawn(['./chromecast.js', './chromecast.js'])
  end

  push do
    reset
    $chromecast_pid = spawn('./chromecast.js', 'YouTube', '5A_CGkVO8cE')
    $zombie_pid = spawn({"LIGHTS" => LIGHTS}, ['./zombies', './zombies'])
    $alarm_pid = spawn('ssh', 'dkordik@192.168.2.4', "afplay '/Users/dkordik/Documents/code/lights/alarm.mp3'")
  end

end