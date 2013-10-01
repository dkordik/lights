#!/usr/bin/env ruby

require "miro"

root=File.dirname(__FILE__)

Miro.options[:color_count] = 16

cover_path="#{root}/.cover"

if File.exist?("#{cover_path}.png")
	cover_path="#{cover_path}.png"
elsif File.exist?("#{cover_path}.jpg")
	cover_path="#{cover_path}.jpg"
else
	puts "No cover found."
	exit(1)
end

colors = Miro::DominantColors.new(cover_path)
puts colors.to_rgb.inspect

`rm #{cover_path}`

exit(0)